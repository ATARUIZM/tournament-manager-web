"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderEntries, toggleBye, removeEntry } from "@/lib/actions/team";
import { TeamEditForm } from "@/components/TeamEditForm";
import { Team } from "@prisma/client";

type EntryWithTeam = {
  id: string;
  teamId: string;
  isBye: boolean;
  sortOrder: number;
  team: Team;
};

function SortableItem({
  entry,
  index,
  tournamentId,
  format,
  onToggleBye,
  onRemove,
}: {
  entry: EntryWithTeam;
  index: number;
  tournamentId: string;
  format: string;
  onToggleBye: (entryId: string) => void;
  onRemove: (entryId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow p-4 ${
        entry.isBye ? "border-l-4 border-orange-400 bg-orange-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* ドラッグハンドル */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
          title="ドラッグして並び替え"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>

        {/* 順番 */}
        <span className="text-sm text-gray-400 w-6 text-center">{index + 1}</span>

        {/* シード(BYE)チェックボックス - トーナメントのみ */}
        {format === "TOURNAMENT" && (
          <label
            className="flex items-center gap-1 cursor-pointer"
            title="1回戦免除（シード）"
          >
            <input
              type="checkbox"
              checked={entry.isBye}
              onChange={() => onToggleBye(entry.id)}
            />
            <span className="text-xs text-orange-600">BYE</span>
          </label>
        )}

        {/* チーム情報 */}
        <div className="flex-1">
          <TeamEditForm
            team={entry.team}
            tournamentId={tournamentId}
            index={index + 1}
          />
        </div>

        {/* 除外ボタン */}
        <button
          type="button"
          className="text-red-500 text-sm hover:text-red-700"
          onClick={() => {
            if (confirm(`${entry.team.name} を大会から除外しますか？`)) {
              onRemove(entry.id);
            }
          }}
        >
          除外
        </button>
      </div>
    </div>
  );
}

export function TeamSortableList({
  entries: serverEntries,
  tournamentId,
  format,
}: {
  entries: EntryWithTeam[];
  tournamentId: string;
  format: string;
}) {
  const [entries, setEntries] = useState(serverEntries);

  // サーバーからの新しいデータ（チーム追加など）を反映
  useEffect(() => {
    setEntries(serverEntries);
  }, [serverEntries]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    const newEntries = arrayMove(entries, oldIndex, newIndex);
    setEntries(newEntries);

    await reorderEntries(
      tournamentId,
      newEntries.map((e) => e.id)
    );
  }

  async function handleToggleBye(entryId: string) {
    // 楽観的に即時反映
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, isBye: !e.isBye } : e
      )
    );
    // サーバーに保存
    await toggleBye(entryId, tournamentId);
  }

  async function handleRemove(entryId: string) {
    // 楽観的に即時反映
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    // サーバーに保存
    await removeEntry(entryId, tournamentId);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={entries.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <SortableItem
              key={entry.id}
              entry={entry}
              index={idx}
              tournamentId={tournamentId}
              format={format}
              onToggleBye={handleToggleBye}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
