"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkPermission(tournamentId: string, userId: string) {
  const perm = await prisma.permission.findFirst({
    where: { tournamentId, userId },
  });
  if (!perm) throw new Error("Unauthorized");
}

export async function createMatch(tournamentId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  const homeTeamId = formData.get("homeTeamId") as string;
  const awayTeamId = formData.get("awayTeamId") as string;
  const matchDate = formData.get("matchDate") as string;
  const startTime = formData.get("startTime") as string;
  const venue = formData.get("venue") as string;
  const memo = formData.get("memo") as string;
  const roundNumber = formData.get("roundNumber") as string;

  if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
    throw new Error("同じチーム同士の試合は登録できません");
  }

  await prisma.match.create({
    data: {
      tournamentId,
      homeTeamId: homeTeamId || null,
      awayTeamId: awayTeamId || null,
      matchDate: matchDate ? new Date(matchDate) : null,
      startTime: startTime || null,
      venue: venue || null,
      memo: memo || null,
      roundNumber: roundNumber ? parseInt(roundNumber) : null,
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/matches`);
}

export async function updateMatchResult(
  matchId: string,
  tournamentId: string,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  const homeScore = formData.get("homeScore") as string;
  const awayScore = formData.get("awayScore") as string;
  const status = formData.get("status") as string;
  const venue = formData.get("venue") as string;
  const matchDate = formData.get("matchDate") as string;
  const startTime = formData.get("startTime") as string;
  const gatherTime = formData.get("gatherTime") as string;
  const memo = formData.get("memo") as string;

  const useManualWinner = formData.get("useManualWinner") as string;
  const winnerChoice = formData.get("winnerChoice") as string;

  const hScore = homeScore !== "" ? parseInt(homeScore) : null;
  const aScore = awayScore !== "" ? parseInt(awayScore) : null;

  // 勝者判定
  let winnerId: string | null = null;
  if (status === "FINISHED") {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (match) {
      if (useManualWinner === "1") {
        // 手動指定
        winnerId = winnerChoice === "home" ? match.homeTeamId : match.awayTeamId;
      } else if (hScore !== null && aScore !== null && hScore !== aScore) {
        // スコアで自動判定
        winnerId = hScore > aScore ? match.homeTeamId : match.awayTeamId;
      }
    }
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: hScore,
      awayScore: aScore,
      winnerId,
      status: status as "SCHEDULED" | "FINISHED" | "CANCELED",
      venue: venue || null,
      matchDate: matchDate ? new Date(matchDate) : null,
      startTime: startTime || null,
      gatherTime: gatherTime || null,
      memo: memo || null,
    },
  });

  // トーナメント形式なら勝者を次のラウンドに反映
  if (winnerId) {
    await advanceBracketWinner(matchId, winnerId);
  }

  revalidatePath(`/admin/tournaments/${tournamentId}/matches`);
}

export async function deleteMatch(matchId: string, tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  await prisma.match.delete({ where: { id: matchId } });
  revalidatePath(`/admin/tournaments/${tournamentId}/matches`);
}

// ==========================================
// リーグ総当たり対戦カード自動生成
// ==========================================
export async function generateLeagueMatches(tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  const entries = await prisma.entry.findMany({
    where: { tournamentId },
    include: { team: true },
    orderBy: { sortOrder: "asc" },
  });

  if (entries.length < 2) throw new Error("チームが2つ以上必要です");

  // 既存の試合を削除
  await prisma.match.deleteMany({ where: { tournamentId } });

  const matches: { homeTeamId: string; awayTeamId: string; roundNumber: number }[] = [];
  const teams = entries.map((e) => e.teamId);
  const n = teams.length;

  // Round-robin scheduling (circle method)
  const roundTeams = [...teams];
  if (n % 2 !== 0) roundTeams.push("BYE");
  const total = roundTeams.length;
  const rounds = total - 1;

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < total / 2; i++) {
      const home = roundTeams[i];
      const away = roundTeams[total - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        matches.push({
          homeTeamId: home,
          awayTeamId: away,
          roundNumber: round + 1,
        });
      }
    }
    // Rotate: fix first, rotate rest
    const last = roundTeams.pop()!;
    roundTeams.splice(1, 0, last);
  }

  await prisma.match.createMany({
    data: matches.map((m) => ({
      tournamentId,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      roundNumber: m.roundNumber,
    })),
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/matches`);
}

// ==========================================
// トーナメント表自動生成（シングルエリミネーション）
// ==========================================
export async function generateBracket(tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { thirdPlaceMatch: true },
  });

  const entries = await prisma.entry.findMany({
    where: { tournamentId },
    orderBy: { sortOrder: "asc" },
  });

  const n = entries.length;
  if (n < 2) throw new Error("チームが2つ以上必要です");

  // bracketSize = n 以上の最小2の累乗
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const totalByes = bracketSize - n;

  // BYE割り当て:
  //   1. entry.isBye=true のチームを優先
  //   2. 残りのBYE枠は上位シード（sortOrder順）から自動割り当て
  const manualByes = entries.filter((e) => e.isBye);
  const nonByes = entries.filter((e) => !e.isBye);

  let byeTeamIds: string[];
  let playTeamIds: string[];

  if (totalByes >= manualByes.length) {
    const extraByes = totalByes - manualByes.length;
    byeTeamIds = [
      ...manualByes.map((e) => e.teamId),
      ...nonByes.slice(0, extraByes).map((e) => e.teamId),
    ];
    playTeamIds = nonByes.slice(extraByes).map((e) => e.teamId);
  } else {
    byeTeamIds = manualByes.slice(0, totalByes).map((e) => e.teamId);
    playTeamIds = [
      ...manualByes.slice(totalByes).map((e) => e.teamId),
      ...nonByes.map((e) => e.teamId),
    ];
  }

  const totalRounds = Math.log2(bracketSize);
  const matchesInRound1 = bracketSize / 2;

  // 既存のブラケットを削除
  // （nextNodeId の自己参照FKを先にクリアしないと deleteMany が失敗する場合がある）
  await prisma.bracketNode.updateMany({
    where: { tournamentId },
    data: { nextNodeId: null },
  });
  await prisma.bracketNode.deleteMany({ where: { tournamentId } });
  await prisma.match.deleteMany({ where: { tournamentId } });

  const nodesByRound: Map<number, string[]> = new Map();

  // ── 1回戦ノードを生成 ────────────────────────────────
  const round1Ids: string[] = [];

  for (let pos = 0; pos < matchesInRound1; pos++) {
    if (pos < totalByes) {
      // BYEノード（試合なし・自動進出）
      const node = await prisma.bracketNode.create({
        data: {
          tournamentId,
          matchId: null,
          round: 1,
          position: pos,
          isBye: true,
          seedTeamId: byeTeamIds[pos],
        },
      });
      round1Ids.push(node.id);
    } else {
      // 通常の試合
      const playIdx = (pos - totalByes) * 2;
      const match = await prisma.match.create({
        data: {
          tournamentId,
          homeTeamId: playTeamIds[playIdx],
          awayTeamId: playTeamIds[playIdx + 1],
          roundNumber: 1,
          status: "SCHEDULED",
        },
      });
      const node = await prisma.bracketNode.create({
        data: {
          tournamentId,
          matchId: match.id,
          round: 1,
          position: pos,
          isBye: false,
        },
      });
      round1Ids.push(node.id);
    }
  }
  nodesByRound.set(1, round1Ids);

  // ── 2回戦以降のノードを生成（チームは未定・空枠） ────
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const roundIds: string[] = [];

    for (let pos = 0; pos < matchesInRound; pos++) {
      const match = await prisma.match.create({
        data: {
          tournamentId,
          roundNumber: round,
          status: "SCHEDULED",
        },
      });
      const node = await prisma.bracketNode.create({
        data: {
          tournamentId,
          matchId: match.id,
          round,
          position: pos,
          isBye: false,
        },
      });
      roundIds.push(node.id);
    }
    nodesByRound.set(round, roundIds);
  }

  // ── nextNodeId を設定（勝者が進む先） ────────────────
  for (let round = 1; round < totalRounds; round++) {
    const currentNodes = nodesByRound.get(round)!;
    const nextNodes = nodesByRound.get(round + 1)!;

    for (let i = 0; i < currentNodes.length; i++) {
      await prisma.bracketNode.update({
        where: { id: currentNodes[i] },
        data: { nextNodeId: nextNodes[Math.floor(i / 2)] },
      });
    }
  }

  // ── BYEチームを次ラウンドに自動配置 ──────────────────
  const round2Ids = nodesByRound.get(2);
  if (round2Ids) {
    for (let pos = 0; pos < totalByes; pos++) {
      const seedTeamId = byeTeamIds[pos];
      const nextNodeId = round2Ids[Math.floor(pos / 2)];
      const nextNode = await prisma.bracketNode.findUnique({
        where: { id: nextNodeId },
        include: { match: true },
      });
      if (!nextNode?.match) continue;

      if (pos % 2 === 0) {
        await prisma.match.update({
          where: { id: nextNode.match.id },
          data: { homeTeamId: seedTeamId },
        });
      } else {
        await prisma.match.update({
          where: { id: nextNode.match.id },
          data: { awayTeamId: seedTeamId },
        });
      }
    }
  }

  // ── 3位決定戦 ────────────────────────────────────────
  if (tournament?.thirdPlaceMatch && totalRounds >= 2) {
    const thirdPlaceMatch = await prisma.match.create({
      data: {
        tournamentId,
        roundNumber: Math.ceil(totalRounds),
      },
    });
    await prisma.bracketNode.create({
      data: {
        tournamentId,
        matchId: thirdPlaceMatch.id,
        round: Math.ceil(totalRounds),
        position: 1,
        isThirdPlace: true,
      },
    });
  }

  revalidatePath(`/admin/tournaments/${tournamentId}/matches`);
}

async function advanceBracketWinner(matchId: string, winnerId: string) {
  const node = await prisma.bracketNode.findUnique({
    where: { matchId },
    include: { nextNode: { include: { match: true } } },
  });

  if (!node?.nextNode?.match) return;

  const nextMatch = node.nextNode.match;
  const position = node.position;

  // 偶数位置→ホーム、奇数位置→アウェイ
  if (position % 2 === 0) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { homeTeamId: winnerId },
    });
  } else {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: { awayTeamId: winnerId },
    });
  }
}

