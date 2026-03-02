import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({
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
      },
    },
  });

  if (!tournament) notFound();

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">お知らせ</h2>
      {tournament.announcements.length === 0 ? (
        <p className="text-gray-500 text-sm">お知らせはまだありません。</p>
      ) : (
        <div className="space-y-3">
          {tournament.announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-lg shadow p-4 ${
                ann.pinned ? "border-l-4 border-red-500" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {ann.pinned && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                    重要
                  </span>
                )}
                <h3 className="font-bold">{ann.title}</h3>
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
      )}
    </div>
  );
}
