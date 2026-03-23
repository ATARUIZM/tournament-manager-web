"use client";

import { registerUser } from "@/lib/actions/auth";
import { isRedirectError } from "next/dist/client/components/redirect";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await registerUser(new FormData(e.currentTarget));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">アカウント登録</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（8文字以上）
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "登録中..." : "アカウントを作成"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/admin/login" className="text-blue-600 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
