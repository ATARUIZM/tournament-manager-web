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

  const hScore = homeScore !== "" ? parseInt(homeScore) : null;
  const aScore = awayScore !== "" ? parseInt(awayScore) : null;

  // 勝者自動判定
  let winnerId: string | null = null;
  if (hScore !== null && aScore !== null && status === "FINISHED") {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (match) {
      if (hScore > aScore) winnerId = match.homeTeamId;
      else if (aScore > hScore) winnerId = match.awayTeamId;
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

  if (entries.length < 2) throw new Error("チームが2つ以上必要です");

  // 既存のブラケットと試合を削除
  await prisma.bracketNode.deleteMany({ where: { tournamentId } });
  await prisma.match.deleteMany({ where: { tournamentId } });

  // チーム数に最適なスロットを構築
  // ・bracketSize = チーム数以上の最小の2の累乗
  // ・firstRoundMatchCount = チーム数 - bracketSize/2（1回戦で実際に試合が必要な組数）
  // ・byeCount = bracketSize/2 - firstRoundMatchCount（1回戦BYEのチーム数）
  // → 上位チーム(1〜byeCount)はBYE、下位チームが1回戦で対戦。null vs null スロットは作らない。
  const n = entries.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const secondRoundTeams = bracketSize / 2;
  const firstRoundMatchCount = n - secondRoundTeams;
  const byeCount = secondRoundTeams - firstRoundMatchCount;
  const teamIds = entries.map((e) => e.teamId);

  const slots: (string | null)[] = [];
  // 上位 byeCount チームは null とペア（1回戦BYE）
  for (let i = 0; i < byeCount; i++) {
    slots.push(teamIds[i]);
    slots.push(null);
  }
  // 残りのチームは順番に並べて1回戦で対戦
  for (let i = byeCount; i < n; i++) {
    slots.push(teamIds[i]);
  }

  const totalRounds = Math.log2(bracketSize);

  // ブラケットノードを全ラウンド分作成
  const nodesByRound: Map<number, string[]> = new Map();

  // 1回戦から作成
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const nodeIds: string[] = [];

    for (let pos = 0; pos < matchesInRound; pos++) {
      let homeTeamId: string | null = null;
      let awayTeamId: string | null = null;
      let isBye = false;

      if (round === 1) {
        const idx1 = pos * 2;
        const idx2 = pos * 2 + 1;
        homeTeamId = slots[idx1];
        awayTeamId = slots[idx2];
        isBye = homeTeamId === null || awayTeamId === null;
      }

      if (isBye) {
        // BYEの場合: Matchを作らず、BracketNodeのみ作成
        const seedTeamId = homeTeamId || awayTeamId;
        const node = await prisma.bracketNode.create({
          data: {
            tournamentId,
            matchId: null,
            round,
            position: pos,
            isBye: true,
            seedTeamId,
          },
        });
        nodeIds.push(node.id);
      } else {
        // 通常の試合
        const match = await prisma.match.create({
          data: {
            tournamentId,
            homeTeamId,
            awayTeamId,
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
        nodeIds.push(node.id);
      }
    }

    nodesByRound.set(round, nodeIds);
  }

  // nextNodeId を設定（各ノードの勝者が進む先）
  for (let round = 1; round < totalRounds; round++) {
    const currentNodes = nodesByRound.get(round)!;
    const nextNodes = nodesByRound.get(round + 1)!;

    for (let i = 0; i < currentNodes.length; i++) {
      const nextNodeIdx = Math.floor(i / 2);
      await prisma.bracketNode.update({
        where: { id: currentNodes[i] },
        data: { nextNodeId: nextNodes[nextNodeIdx] },
      });
    }
  }

  // BYEの勝者を次ラウンドに自動反映
  for (let round = 1; round < totalRounds; round++) {
    const currentNodes = nodesByRound.get(round)!;
    for (const nodeId of currentNodes) {
      const node = await prisma.bracketNode.findUnique({
        where: { id: nodeId },
      });
      if (node?.isBye && node.seedTeamId && node.nextNodeId) {
        await advanceBracketWinnerByNode(node.id, node.seedTeamId);
      }
    }
  }

  // 3位決定戦
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
        position: 1, // 決勝の隣
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

async function advanceBracketWinnerByNode(nodeId: string, winnerId: string) {
  const node = await prisma.bracketNode.findUnique({
    where: { id: nodeId },
    include: { nextNode: { include: { match: true } } },
  });

  if (!node?.nextNode?.match) return;

  const nextMatch = node.nextNode.match;
  const position = node.position;

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
