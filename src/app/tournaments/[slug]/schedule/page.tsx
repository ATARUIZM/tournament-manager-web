import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ScheduleFilter } from "@/components/ScheduleFilter";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; venue?: string; status?: string }>;
}) {
  const { slug } = await params;
  const filters = await searchParams;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: [{ matchDate: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  // フィルタリング
  let matches = tournament.matches;

  if (filters.date) {
    const filterDate = new Date(filters.date);
    matches = matches.filter((m) => {
      if (!m.matchDate) return false;
      const d = new Date(m.matchDate);
      return d.toDateString() === filterDate.toDateString();
    });
  }

  if (filters.venue) {
    matches = matches.filter(
      (m) => m.venue?.includes(filters.venue!) ?? false
    );
  }

  if (filters.status) {
    matches = matches.filter((m) => m.status === filters.status);
  }

  // 会場リスト（フィルタ用）
  const venues = [
    ...new Set(
      tournament.matches.filter((m) => m.venue).map((m) => m.venue!)
    ),
  ];

  // 日付でグルーピング
  const grouped = new Map<string, typeof matches>();
  for (const m of matches) {
    const key = m.matchDate
      ? new Date(m.matchDate).toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })
      : "日程未定";
    const list = grouped.get(key) || [];
    list.push(m);
    grouped.set(key, list);
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">日程一覧</h2>

      <ScheduleFilter slug={slug} venues={venues} />

      {matches.length === 0 ? (
        <p className="text-gray-500 text-sm mt-4">該当する試合がありません。</p>
      ) : (
        <div className="space-y-6 mt-4">
          {Array.from(grouped.entries()).map(([dateLabel, dateMatches]) => (
            <div key={dateLabel}>
              <h3 className="font-bold text-sm text-gray-700 mb-2 border-b pb-1">
                {dateLabel}
              </h3>
              <div className="space-y-2">
                {dateMatches.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-lg shadow p-3 flex items-center gap-3 text-sm"
                  >
                    <span className="text-gray-500 w-12">
                      {m.startTime || ""}
                    </span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium text-right flex-1">
                        {m.homeTeam?.name || "TBD"}
                      </span>
                      {m.status === "FINISHED" ? (
                        <span className="font-bold text-center w-16">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      ) : m.status === "CANCELED" ? (
                        <span className="text-center w-16 text-gray-400">
                          中止
                        </span>
                      ) : (
                        <span className="text-center w-16 text-gray-300">
                          vs
                        </span>
                      )}
                      <span className="font-medium flex-1">
                        {m.awayTeam?.name || "TBD"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 w-24 truncate text-right">
                      {m.venue || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
