import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TournamentForm } from "@/components/TournamentForm";
import { updateTournament, deleteTournament } from "@/lib/actions/tournament";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function TournamentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) notFound();

  const updateAction = updateTournament.bind(null, id);
  const deleteAction = deleteTournament.bind(null, id);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">大会設定</h2>
      <TournamentForm
        tournament={tournament}
        action={updateAction}
        submitLabel="保存"
      />
      <div className="mt-12 border-t pt-6">
        <h3 className="text-red-600 font-bold mb-2">危険な操作</h3>
        <form action={deleteAction}>
          <ConfirmButton
            message="本当にこの大会を削除しますか？すべてのデータが失われます。"
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
          >
            大会を削除
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
