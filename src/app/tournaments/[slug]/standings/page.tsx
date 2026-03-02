import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type TeamStats = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      entries: { include: { team: true } },
      matches: {
        where: { status: "FINISHED" },
        include: { homeTeam: true, awayTeam: true },
      },
    },
  });

  if (!tournament) notFound();
  if (tournament.format !== "LEAGUE") redirect(`/tournaments/${slug}`);

  // 順位表を計算
  const statsMap = new Map<string, TeamStats>();

  for (const entry of tournament.entries) {
    statsMap.set(entry.teamId, {
      teamId: entry.teamId,
      teamName: entry.team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of tournament.matches) {
    if (
      match.homeScore === null ||
      match.awayScore === null ||
      !match.homeTeamId ||
      !match.awayTeamId
    )
      continue;

    const home = statsMap.get(match.homeTeamId);
    const away = statsMap.get(match.awayTeamId);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;
      home.points += tournament.winPoints;
      away.points += tournament.losePoints;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      home.lost++;
      away.points += tournament.winPoints;
      home.points += tournament.losePoints;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += tournament.drawPoints;
      away.points += tournament.drawPoints;
    }
  }

  const standings = Array.from(statsMap.values())
    .map((s) => ({ ...s, goalDifference: s.goalsFor - s.goalsAgainst }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">順位表</h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg shadow text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2 text-left w-8">#</th>
              <th className="px-3 py-2 text-left">チーム</th>
              <th className="px-3 py-2 text-center w-10">試</th>
              <th className="px-3 py-2 text-center w-10">勝</th>
              <th className="px-3 py-2 text-center w-10">分</th>
              <th className="px-3 py-2 text-center w-10">負</th>
              <th className="px-3 py-2 text-center w-10">得</th>
              <th className="px-3 py-2 text-center w-10">失</th>
              <th className="px-3 py-2 text-center w-12">差</th>
              <th className="px-3 py-2 text-center w-12 font-bold">勝点</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => (
              <tr
                key={s.teamId}
                className={`border-b last:border-0 ${
                  i < 1 ? "bg-yellow-50" : ""
                }`}
              >
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2 font-medium">{s.teamName}</td>
                <td className="px-3 py-2 text-center">{s.played}</td>
                <td className="px-3 py-2 text-center">{s.won}</td>
                <td className="px-3 py-2 text-center">{s.drawn}</td>
                <td className="px-3 py-2 text-center">{s.lost}</td>
                <td className="px-3 py-2 text-center">{s.goalsFor}</td>
                <td className="px-3 py-2 text-center">{s.goalsAgainst}</td>
                <td className="px-3 py-2 text-center">
                  {s.goalDifference > 0
                    ? `+${s.goalDifference}`
                    : s.goalDifference}
                </td>
                <td className="px-3 py-2 text-center font-bold">
                  {s.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        勝点: 勝{tournament.winPoints} 分{tournament.drawPoints} 負
        {tournament.losePoints}
      </p>
    </div>
  );
}
