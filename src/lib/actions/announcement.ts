"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkPermission(tournamentId: string, userId: string) {
  const perm = await prisma.permission.findFirst({
    where: { tournamentId, userId },
  });
  if (!perm) throw new Error("Unauthorized");
}

export async function createAnnouncement(tournamentId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const pinned = formData.get("pinned") === "on";

  await prisma.announcement.create({
    data: { tournamentId, title, content, pinned },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/announcements`);
}

export async function updateAnnouncement(
  announcementId: string,
  tournamentId: string,
  formData: FormData
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  await prisma.announcement.update({
    where: { id: announcementId },
    data: {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      pinned: formData.get("pinned") === "on",
      published: formData.get("published") !== "off",
    },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/announcements`);
}

export async function deleteAnnouncement(announcementId: string, tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(tournamentId, user.id);

  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidatePath(`/admin/tournaments/${tournamentId}/announcements`);
}

export async function togglePin(announcementId: string, tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ann = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: { tournamentId: true, pinned: true },
  });
  if (!ann) throw new Error("Not found");
  await checkPermission(ann.tournamentId, user.id);

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { pinned: !ann.pinned },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/announcements`);
}
