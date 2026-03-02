import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournaments = await prisma.tournament.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen">
      <header className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">大会管理システム</h1>
          <p className="text-blue-200">大会の日程・結果をかんたん確認</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4">開催中の大会</h2>
        {tournaments.length === 0 ? (
          <p className="text-gray-500">まだ大会がありません。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition p-5"
              >
                <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {t.format === "LEAGUE" ? "リーグ戦" : "トーナメント"}
                </span>
                {t.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {t.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
