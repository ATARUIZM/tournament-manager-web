import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  createAnnouncement,
  deleteAnnouncement,
  togglePin,
} from "@/lib/actions/announcement";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      announcements: { orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!tournament) notFound();

  const createAction = createAnnouncement.bind(null, id);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">
        お知らせ（{tournament.announcements.length}件）
      </h2>

      <div className="space-y-3 mb-8">
        {tournament.announcements.map((ann) => (
          <div key={ann.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {ann.pinned && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      固定
                    </span>
                  )}
                  <h3 className="font-bold">{ann.title}</h3>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {ann.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(ann.createdAt).toLocaleString("ja-JP")}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <form action={togglePin.bind(null, ann.id, id)}>
                  <button
                    type="submit"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {ann.pinned ? "固定解除" : "固定"}
                  </button>
                </form>
                <form action={deleteAnnouncement.bind(null, ann.id, id)}>
                  <ConfirmButton
                    message="このお知らせを削除しますか？"
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    削除
                  </ConfirmButton>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-3">新規お知らせ</h3>
        <form action={createAction} className="space-y-3 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">タイトル *</label>
            <input
              name="title"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">内容 *</label>
            <textarea
              name="content"
              required
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="pinned" />
            <span className="text-sm">固定表示</span>
          </label>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            投稿
          </button>
        </form>
      </div>
    </div>
  );
}
