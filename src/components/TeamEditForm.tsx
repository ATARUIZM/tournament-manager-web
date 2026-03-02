"use client";

import { useState } from "react";
import { Team } from "@prisma/client";
import { updateTeam } from "@/lib/actions/team";

export function TeamEditForm({
  team,
  tournamentId,
  index,
}: {
  team: Team;
  tournamentId: string;
  index: number;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-400 w-6">{index}</span>
        <div>
          <span className="font-bold">{team.name}</span>
          {team.representative && (
            <span className="text-sm text-gray-500 ml-2">
              ({team.representative})
            </span>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-blue-600 hover:text-blue-800 ml-auto"
        >
          編集
        </button>
      </div>
    );
  }

  const action = async (formData: FormData) => {
    await updateTeam(team.id, tournamentId, formData);
    setEditing(false);
  };

  return (
    <form action={action} className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          name="name"
          defaultValue={team.name}
          required
          className="border rounded px-2 py-1 text-sm"
          placeholder="チーム名"
        />
        <input
          name="representative"
          defaultValue={team.representative || ""}
          className="border rounded px-2 py-1 text-sm"
          placeholder="代表者名"
        />
        <input
          name="contact"
          defaultValue={team.contact || ""}
          className="border rounded px-2 py-1 text-sm"
          placeholder="連絡先"
        />
        <input
          name="memo"
          defaultValue={team.memo || ""}
          className="border rounded px-2 py-1 text-sm"
          placeholder="メモ"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          保存
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-gray-500 px-3 py-1"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
