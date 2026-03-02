"use client";

import { useState } from "react";

export function GenerateBracketButton({
  action,
  hasExisting,
}: {
  action: () => Promise<void>;
  hasExisting: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (hasExisting && !confirm("既存の試合を削除して再生成しますか？")) return;
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition"
      >
        {pending ? "生成中..." : "トーナメント表生成"}
      </button>
      {error && (
        <p className="text-red-600 text-xs max-w-xs text-right">{error}</p>
      )}
    </div>
  );
}
