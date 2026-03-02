"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

type TeamEntry = {
  teamId: string;
  teamName: string;
};

export function MatchCreateForm({
  entries,
  action,
}: {
  entries: TeamEntry[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const handleAction = async (formData: FormData) => {
    const home = formData.get("homeTeamId") as string;
    const away = formData.get("awayTeamId") as string;

    if (home && away && home === away) {
      setError("同じチーム同士の試合は登録できません");
      return;
    }

    setError("");
    await action(formData);
    showToast("試合を追加しました");
    setHomeTeamId("");
    setAwayTeamId("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-bold mb-3">試合を手動追加</h3>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-3 text-sm">
          {error}
        </div>
      )}
      <form action={handleAction} className="space-y-3 max-w-lg">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">ホーム</label>
            <select
              name="homeTeamId"
              value={homeTeamId}
              onChange={(e) => {
                setHomeTeamId(e.target.value);
                setError("");
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">-- 選択 --</option>
              {entries.map((e) => (
                <option key={e.teamId} value={e.teamId}>
                  {e.teamName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">アウェイ</label>
            <select
              name="awayTeamId"
              value={awayTeamId}
              onChange={(e) => {
                setAwayTeamId(e.target.value);
                setError("");
              }}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              <option value="">-- 選択 --</option>
              {entries.map((e) => (
                <option
                  key={e.teamId}
                  value={e.teamId}
                  disabled={e.teamId === homeTeamId}
                  className={e.teamId === homeTeamId ? "text-gray-300" : ""}
                >
                  {e.teamName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">日付</label>
            <input
              type="date"
              name="matchDate"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">開始時間</label>
            <input
              type="time"
              name="startTime"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">会場</label>
            <input
              name="venue"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">節/ラウンド</label>
            <input
              type="number"
              name="roundNumber"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">メモ</label>
          <input
            name="memo"
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
        >
          追加
        </button>
      </form>
    </div>
  );
}
