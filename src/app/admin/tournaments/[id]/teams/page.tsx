import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createTeamAndEntry } from "@/lib/actions/team";
import { TeamSortableList } from "@/components/TeamSortableList";
import { BracketView } from "@/components/BracketView";
import { computeBracketPreview } from "@/lib/bracketPreview";
import { TeamCreateForm } from "@/components/TeamCreateForm";

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

  // トーナメント形式の場合のみプレビュー計算
  const preview =
    tournament.format === "TOURNAMENT" && tournament.entries.length >= 2
      ? computeBracketPreview(
          tournament.entries.map((e) => ({
            teamId: e.teamId,
            teamName: e.team.name,
            isBye: e.isBye,
          })),
          tournament.thirdPlaceMatch
        )
      : null;

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

      {/* トーナメント表プレビュー（生成前シミュレーション） */}
      {preview && (
        <div className="bg-white rounded-lg shadow p-4 mb-8">
          <h3 className="text-sm font-bold text-gray-700 mb-1">
            トーナメント表プレビュー
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            現在のチーム順・BYE設定で生成した場合のイメージです。
          </p>
          <BracketView rounds={preview.rounds} thirdPlace={preview.thirdPlace} />
        </div>
      )}

      {/* 新規チーム追加 */}
      <TeamCreateForm action={createAction} />
    </div>
  );
}
