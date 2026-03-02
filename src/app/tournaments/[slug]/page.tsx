import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TournamentTopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      announcements: {
        where: { published: true },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 3,
      },
      matches: {
        include: { homeTeam: true, awayTeam: true, winner: true },
        orderBy: [{ matchDate: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  // 今日の試合
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayMatches = tournament.matches.filter((m) => {
    if (!m.matchDate) return false;
    const d = new Date(m.matchDate);
    return d >= today && d < tomorrow;
  });

  // 直近の試合（今日以降で未完了）
  const upcomingMatches = tournament.matches
    .filter(
      (m) =>
        m.status === "SCHEDULED" &&
        m.matchDate &&
        new Date(m.matchDate) >= today
    )
    .slice(0, 5);

  // 最新の結果
  const recentResults = tournament.matches
    .filter((m) => m.status === "FINISHED")
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-8">
      {/* お知らせ */}
      {tournament.announcements.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">お知らせ</h2>
          <div className="space-y-2">
            {tournament.announcements.map((ann) => (
              <div
                key={ann.id}
                className={`bg-white rounded-lg shadow p-4 ${
                  ann.pinned ? "border-l-4 border-red-500" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {ann.pinned && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      重要
                    </span>
                  )}
                  <h3 className="font-bold text-sm">{ann.title}</h3>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(ann.createdAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 今日の試合 */}
      {todayMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3 text-blue-700">
            今日の試合
          </h2>
          <div className="space-y-2">
            {todayMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* 直近の予定 */}
      {upcomingMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">今後の予定</h2>
          <div className="space-y-2">
            {upcomingMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* 最新結果 */}
      {recentResults.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">最新の結果</h2>
          <div className="space-y-2">
            {recentResults.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {/* 大会情報 */}
      <section>
        <h2 className="text-lg font-bold mb-3">大会情報</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">形式</dt>
            <dd>{tournament.format === "LEAGUE" ? "リーグ戦" : "トーナメント"}</dd>
            {tournament.startDate && (
              <>
                <dt className="text-gray-500">開催期間</dt>
                <dd>
                  {new Date(tournament.startDate).toLocaleDateString("ja-JP")}
                  {tournament.endDate &&
                    ` 〜 ${new Date(tournament.endDate).toLocaleDateString("ja-JP")}`}
                </dd>
              </>
            )}
          </dl>
          {tournament.description && (
            <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">
              {tournament.description}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function MatchCard({
  match,
}: {
  match: {
    id: string;
    matchDate: Date | null;
    startTime: string | null;
    gatherTime: string | null;
    venue: string | null;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { name: string } | null;
    awayTeam: { name: string } | null;
  };
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span>
          {match.matchDate &&
            new Date(match.matchDate).toLocaleDateString("ja-JP", {
              month: "numeric",
              day: "numeric",
              weekday: "short",
            })}
          {match.startTime && ` ${match.startTime}`}
        </span>
        {match.venue && <span>{match.venue}</span>}
      </div>
      <div className="flex items-center justify-center gap-4">
        <span className="font-bold text-right flex-1">
          {match.homeTeam?.name || "TBD"}
        </span>
        {match.status === "FINISHED" ? (
          <span className="font-bold text-xl px-3">
            {match.homeScore} - {match.awayScore}
          </span>
        ) : match.status === "CANCELED" ? (
          <span className="text-gray-400 px-3">中止</span>
        ) : (
          <span className="text-gray-400 px-3">vs</span>
        )}
        <span className="font-bold text-left flex-1">
          {match.awayTeam?.name || "TBD"}
        </span>
      </div>
      {match.gatherTime && (
        <p className="text-xs text-gray-400 text-center mt-1">
          集合: {match.gatherTime}
        </p>
      )}
    </div>
  );
}
