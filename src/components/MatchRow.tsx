"use client";

import { useState } from "react";
import { updateMatchResult, deleteMatch } from "@/lib/actions/match";
import { Match, Team, MatchStatus } from "@prisma/client";

type MatchWithTeams = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
  winner: Team | null;
};

export function MatchRow({
  match,
  tournamentId,
}: {
  match: MatchWithTeams;
  tournamentId: string;
}) {
  const [editing, setEditing] = useState(false);

  const statusLabel: Record<MatchStatus, string> = {
    SCHEDULED: "予定",
    FINISHED: "終了",
    CANCELED: "中止",
  };

  const statusColor: Record<MatchStatus, string> = {
    SCHEDULED: "bg-yellow-100 text-yellow-800",
    FINISHED: "bg-green-100 text-green-800",
    CANCELED: "bg-gray-100 text-gray-500",
  };

  const formatDate = (d: Date | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  };

  if (!editing) {
    return (
      <div className="bg-white rounded-lg shadow p-3 flex items-center gap-3 text-sm">
        {match.roundNumber && (
          <span className="text-xs text-gray-400 w-12">
            R{match.roundNumber}
          </span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded ${statusColor[match.status]}`}>
          {statusLabel[match.status]}
        </span>
        <span className="text-gray-500 w-20">{formatDate(match.matchDate)}</span>
        <span className="text-gray-500 w-12">{match.startTime || ""}</span>
        <div className="flex-1 flex items-center gap-2">
          <span className="font-medium text-right flex-1">
            {match.homeTeam?.name || "TBD"}
          </span>
          {match.status === "FINISHED" ? (
            <span className="font-bold text-center w-16">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-center w-16 text-gray-300">vs</span>
          )}
          <span className="font-medium flex-1">
            {match.awayTeam?.name || "TBD"}
          </span>
        </div>
        <span className="text-xs text-gray-400 w-20 truncate">
          {match.venue || ""}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          編集
        </button>
      </div>
    );
  }

  const updateAction = async (formData: FormData) => {
    await updateMatchResult(match.id, tournamentId, formData);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("この試合を削除しますか？")) {
      await deleteMatch(match.id, tournamentId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border-2 border-blue-200">
      <form action={updateAction} className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {match.homeTeam?.name || "TBD"} vs {match.awayTeam?.name || "TBD"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {match.homeTeam?.name || "ホーム"}
            </label>
            <input
              type="number"
              name="homeScore"
              defaultValue={match.homeScore ?? ""}
              min="0"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {match.awayTeam?.name || "アウェイ"}
            </label>
            <input
              type="number"
              name="awayScore"
              defaultValue={match.awayScore ?? ""}
              min="0"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">状態</label>
            <select
              name="status"
              defaultValue={match.status}
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="SCHEDULED">予定</option>
              <option value="FINISHED">終了</option>
              <option value="CANCELED">中止</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">日付</label>
            <input
              type="date"
              name="matchDate"
              defaultValue={
                match.matchDate
                  ? new Date(match.matchDate).toISOString().split("T")[0]
                  : ""
              }
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              開始時間
            </label>
            <input
              type="time"
              name="startTime"
              defaultValue={match.startTime || ""}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              集合時間
            </label>
            <input
              type="time"
              name="gatherTime"
              defaultValue={match.gatherTime || ""}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">会場</label>
            <input
              name="venue"
              defaultValue={match.venue || ""}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">メモ</label>
            <input
              name="memo"
              defaultValue={match.memo || ""}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            保存
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-gray-500 text-sm px-3 py-1"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-500 text-sm px-3 py-1 ml-auto hover:text-red-700"
          >
            削除
          </button>
        </div>
      </form>
    </div>
  );
}
