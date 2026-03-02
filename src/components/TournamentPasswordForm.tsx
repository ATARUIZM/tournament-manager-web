"use client";

import { verifyViewPassword } from "@/lib/actions/viewAccess";
import { useState } from "react";

export function TournamentPasswordForm({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await verifyViewPassword(slug, new FormData(e.currentTarget));
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-2">閲覧パスワード</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          この大会の閲覧にはパスワードが必要です
        </p>
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="パスワードを入力"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "確認中..." : "入場する"}
          </button>
        </form>
      </div>
    </div>
  );
}
