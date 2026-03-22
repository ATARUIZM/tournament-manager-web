"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ScheduleFilter({
  slug,
  venues,
}: {
  slug: string;
  venues: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tournaments/${slug}/schedule?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm items-center">
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          defaultChecked={searchParams.get("hideTbd") === "1"}
          onChange={(e) => updateFilter("hideTbd", e.target.checked ? "1" : "")}
          className="w-4 h-4"
        />
        TBD vs TBD を非表示
      </label>
      <input
        type="date"
        defaultValue={searchParams.get("date") || ""}
        onChange={(e) => updateFilter("date", e.target.value)}
        className="border rounded px-2 py-1"
      />
      {venues.length > 0 && (
        <select
          defaultValue={searchParams.get("venue") || ""}
          onChange={(e) => updateFilter("venue", e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">全会場</option>
          {venues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      )}
      <select
        defaultValue={searchParams.get("status") || ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">全状態</option>
        <option value="SCHEDULED">予定</option>
        <option value="FINISHED">終了</option>
        <option value="CANCELED">中止</option>
      </select>
    </div>
  );
}
