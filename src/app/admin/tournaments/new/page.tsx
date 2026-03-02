import { TournamentForm } from "@/components/TournamentForm";
import { createTournament } from "@/lib/actions/tournament";

export default function NewTournamentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新規大会作成</h1>
      <TournamentForm action={createTournament} submitLabel="作成" />
    </div>
  );
}
