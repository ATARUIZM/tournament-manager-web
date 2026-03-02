import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createTeamAndEntry } from "@/lib/actions/team";
import { TeamSortableList } from "@/components/TeamSortableList";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      entries: {
        include: { team: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!tournament) notFound();

  const createAction = createTeamAndEntry.bind(null, id);

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">
        参加チーム（{tournament.entries.length}チーム）
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        ドラッグ&amp;ドロップで並び替えできます。
        {tournament.format === "TOURNAMENT" &&
          "この順番でトーナメント表が生成されます。BYEにチェックを入れると1回戦免除（シード）になります。"}
      </p>

      {/* チーム一覧（D&D対応） */}
      <div className="mb-8">
        <TeamSortableList
          entries={tournament.entries}
          tournamentId={id}
          format={tournament.format}
        />
      </div>

      {/* 新規チーム追加 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-3">新規チーム追加</h3>
        <form action={createAction} className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">チーム名 *</label>
            <input
              name="name"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">代表者名</label>
            <input
              name="representative"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">連絡先</label>
            <input
              name="contact"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">メモ</label>
            <textarea
              name="memo"
              rows={2}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            追加
          </button>
        </form>
      </div>
    </div>
  );
}
