import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  createMatch,
  generateLeagueMatches,
  generateBracket,
} from "@/lib/actions/match";
import { MatchRow } from "@/components/MatchRow";
import { ConfirmButton } from "@/components/ConfirmButton";
import { MatchCreateForm } from "@/components/MatchCreateForm";
import { GenerateBracketButton } from "@/components/GenerateBracketButton";
import { BracketView } from "@/components/BracketView";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      entries: { include: { team: true }, orderBy: { sortOrder: "asc" } },
      matches: {
        include: { homeTeam: true, awayTeam: true, winner: true },
        orderBy: [
          { matchDate: { sort: "asc", nulls: "last" } },
          { roundNumber: { sort: "asc", nulls: "last" } },
          { startTime: { sort: "asc", nulls: "last" } },
          { bracketNode: { position: "asc" } },
        ],
      },
      bracketNodes: {
        include: {
          match: {
            include: { homeTeam: true, awayTeam: true, winner: true },
          },
          seedTeam: true,
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  const createAction = createMatch.bind(null, id);
  const generateLeagueAction = generateLeagueMatches.bind(null, id);
  const generateBracketAction = generateBracket.bind(null, id);

  const entries = tournament.entries.map((e) => ({
    teamId: e.teamId,
    teamName: e.team.name,
  }));

  // トーナメント表データの構築
  const bracketNodes = tournament.bracketNodes.filter((n) => !n.isThirdPlace);
  const thirdPlaceNode = tournament.bracketNodes.find((n) => n.isThirdPlace);
  const maxRound =
    bracketNodes.length > 0 ? Math.max(...bracketNodes.map((n) => n.round)) : 0;

  const roundsMap = new Map<number, typeof bracketNodes>();
  for (const node of bracketNodes) {
    const list = roundsMap.get(node.round) ?? [];
    list.push(node);
    roundsMap.set(node.round, list);
  }

  const roundLabel = (round: number, max: number) => {
    if (round === max) return "決勝";
    if (round === max - 1) return "準決勝";
    if (round === max - 2) return "準々決勝";
    return `${round}回戦`;
  };

  const bracketRounds = Array.from(roundsMap.entries()).map(
    ([round, roundNodes]) => ({
      round,
      label: roundLabel(round, maxRound),
      matches: roundNodes.map((n) => ({
        id: n.id,
        homeTeam: n.isBye ? (n.seedTeam?.name ?? "") : (n.match?.homeTeam?.name ?? ""),
        awayTeam: n.isBye ? "" : (n.match?.awayTeam?.name ?? ""),
        homeScore: n.match?.homeScore ?? null,
        awayScore: n.match?.awayScore ?? null,
        winner: n.match?.winner?.name ?? null,
        status: n.match?.status ?? (n.isBye ? "FINISHED" : "SCHEDULED"),
        isBye: n.isBye,
      })),
    })
  );

  const thirdPlaceData =
    thirdPlaceNode?.match
      ? {
          homeTeam: thirdPlaceNode.match.homeTeam?.name ?? "",
          awayTeam: thirdPlaceNode.match.awayTeam?.name ?? "",
          homeScore: thirdPlaceNode.match.homeScore,
          awayScore: thirdPlaceNode.match.awayScore,
          winner: thirdPlaceNode.match.winner?.name ?? null,
          status: thirdPlaceNode.match.status,
        }
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          試合一覧（{tournament.matches.length}試合）
        </h2>
        <div className="flex gap-2">
          {tournament.format === "LEAGUE" ? (
            <form action={generateLeagueAction}>
              {tournament.matches.length > 0 ? (
                <ConfirmButton
                  message="既存の試合を削除して再生成しますか？"
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                >
                  総当たり生成
                </ConfirmButton>
              ) : (
                <button
                  type="submit"
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                >
                  総当たり生成
                </button>
              )}
            </form>
          ) : (
            <GenerateBracketButton
              action={generateBracketAction}
              hasExisting={tournament.matches.length > 0}
            />
          )}
        </div>
      </div>

      {/* トーナメント表プレビュー */}
      {tournament.format === "TOURNAMENT" && bracketRounds.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">トーナメント表</h3>
          <BracketView rounds={bracketRounds} thirdPlace={thirdPlaceData} />
        </div>
      )}

      {/* 試合一覧 */}
      <div className="space-y-2 mb-8">
        {tournament.matches.length === 0 ? (
          <p className="text-gray-500 text-sm">
            試合がありません。
            {tournament.format === "LEAGUE"
              ? "「総当たり生成」で自動生成できます。"
              : "「トーナメント表生成」で自動生成できます。"}
          </p>
        ) : (
          tournament.matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              tournamentId={id}
            />
          ))
        )}
      </div>

      {/* 手動追加 */}
      <MatchCreateForm entries={entries} action={createAction} />
    </div>
  );
}
