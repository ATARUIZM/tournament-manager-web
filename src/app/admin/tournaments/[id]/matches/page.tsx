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
        orderBy: [{ roundNumber: "asc" }, { matchDate: "asc" }],
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
            <form action={generateBracketAction}>
              {tournament.matches.length > 0 ? (
                <ConfirmButton
                  message="既存の試合を削除して再生成しますか？"
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                >
                  トーナメント表生成
                </ConfirmButton>
              ) : (
                <button
                  type="submit"
                  className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition"
                >
                  トーナメント表生成
                </button>
              )}
            </form>
          )}
        </div>
      </div>

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
