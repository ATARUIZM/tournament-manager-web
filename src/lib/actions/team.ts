"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTeamAndEntry(tournamentId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const representative = formData.get("representative") as string;
  const contact = formData.get("contact") as string;
  const memo = formData.get("memo") as string;

  // 現在の最大sortOrderを取得
  const maxEntry = await prisma.entry.findFirst({
    where: { tournamentId },
    orderBy: { sortOrder: "desc" },
  });
  const nextOrder = (maxEntry?.sortOrder ?? -1) + 1;

  const team = await prisma.team.create({
    data: {
      name,
      representative: representative || null,
      contact: contact || null,
      memo: memo || null,
    },
  });

  await prisma.entry.create({
    data: {
      tournamentId,
      teamId: team.id,
      sortOrder: nextOrder,
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
}

export async function updateTeam(teamId: string, tournamentId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.team.update({
    where: { id: teamId },
    data: {
      name: formData.get("name") as string,
      representative: (formData.get("representative") as string) || null,
      contact: (formData.get("contact") as string) || null,
      memo: (formData.get("memo") as string) || null,
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
}

export async function removeEntry(entryId: string, tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.entry.delete({ where: { id: entryId } });
  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
}

export async function reorderEntries(
  tournamentId: string,
  orderedEntryIds: string[]
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  // トランザクションでまとめて更新
  await prisma.$transaction(
    orderedEntryIds.map((id, index) =>
      prisma.entry.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
}

export async function toggleBye(entryId: string, tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Not found");

  await prisma.entry.update({
    where: { id: entryId },
    data: { isBye: !entry.isBye },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
}
