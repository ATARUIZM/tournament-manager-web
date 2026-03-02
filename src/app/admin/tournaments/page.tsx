import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const tournaments = await prisma.tournament.findMany({
    where: {
      permissions: {
        some: { userId: user.id },
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true, matches: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">大会一覧</h1>
        <Link
          href="/admin/tournaments/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          新規大会作成
        </Link>
      </div>
      {tournaments.length === 0 ? (
        <p className="text-gray-500">大会がまだありません。</p>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-lg shadow p-5 flex items-center justify-between"
            >
              <div>
                <h2 className="font-bold text-lg">{t.name}</h2>
                <div className="flex gap-3 text-sm text-gray-500 mt-1">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                    {t.format === "LEAGUE" ? "リーグ" : "トーナメント"}
                  </span>
                  <span>チーム: {t._count.entries}</span>
                  <span>試合: {t._count.matches}</span>
                  <span className="text-gray-400">/{t.slug}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/tournaments/${t.id}/matches`}
                  className="text-sm bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 transition"
                >
                  管理
                </Link>
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="text-sm text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition"
                  target="_blank"
                >
                  公開ページ
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
