"use client";

import { useRef, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
};

export function TeamCreateForm({ action }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await action(formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-bold mb-3">新規チーム追加</h3>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">チーム名 *</label>
          <input
            name="name"
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">代表者名</label>
          <input
            name="representative"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">連絡先</label>
          <input
            name="contact"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">メモ</label>
          <textarea
            name="memo"
            rows={2}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
        >
          {isPending ? "追加中..." : "追加"}
        </button>
      </form>
    </div>
  );
}
