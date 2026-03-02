"use client";

import { useRef } from "react";
import { Tournament } from "@prisma/client";
import { useToast } from "@/components/Toast";

type Props = {
  tournament?: Tournament;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

export function TournamentForm({ tournament, action, submitLabel }: Props) {
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleAction = async (formData: FormData) => {
    await action(formData);
    // createTournament は redirect するのでここに来るのは update のみ
    showToast("保存しました");
  };

  return (
    <form ref={formRef} action={handleAction} className="space-y-4 max-w-xl">
      <div>
        <label className="block text-sm font-medium mb-1">大会名 *</label>
        <input
          name="name"
          defaultValue={tournament?.name}
          required
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          スラッグ（URL） *
        </label>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>/tournaments/</span>
          <input
            name="slug"
            defaultValue={tournament?.slug}
            required
            pattern="[a-z0-9\-]+"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="spring-league-2025"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">説明</label>
        <textarea
          name="description"
          defaultValue={tournament?.description || ""}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">形式 *</label>
        <select
          name="format"
          defaultValue={tournament?.format || "LEAGUE"}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="LEAGUE">リーグ（総当たり）</option>
          <option value="TOURNAMENT">トーナメント</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">開始日</label>
          <input
            type="date"
            name="startDate"
            defaultValue={formatDate(tournament?.startDate)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">終了日</label>
          <input
            type="date"
            name="endDate"
            defaultValue={formatDate(tournament?.endDate)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="thirdPlaceMatch"
            defaultChecked={tournament?.thirdPlaceMatch}
          />
          <span className="text-sm">3位決定戦あり（トーナメント形式のみ）</span>
        </label>
      </div>
      {tournament && (
        <fieldset className="border rounded-lg p-4">
          <legend className="text-sm font-medium px-2">公開設定</legend>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium w-24">公開状態</label>
              <select
                name="isPublic"
                defaultValue={tournament.isPublic ? "true" : "false"}
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">公開</option>
                <option value="false">非公開</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                閲覧パスワード（設定すると入力者のみ閲覧可）
              </label>
              <input
                type="text"
                name="viewPassword"
                defaultValue={tournament.viewPassword || ""}
                placeholder="未設定の場合は空欄"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </fieldset>
      )}
      {tournament && (
        <fieldset className="border rounded-lg p-4">
          <legend className="text-sm font-medium px-2">
            勝点設定（リーグ形式のみ）
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">勝利</label>
              <input
                type="number"
                name="winPoints"
                defaultValue={tournament.winPoints}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">引分</label>
              <input
                type="number"
                name="drawPoints"
                defaultValue={tournament.drawPoints}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">敗北</label>
              <input
                type="number"
                name="losePoints"
                defaultValue={tournament.losePoints}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </fieldset>
      )}
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {submitLabel}
      </button>
    </form>
  );
}
