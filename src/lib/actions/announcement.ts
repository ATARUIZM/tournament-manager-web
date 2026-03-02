"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(tournamentId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

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

  await prisma.announcement.delete({ where: { id: announcementId } });
  revalidatePath(`/admin/tournaments/${tournamentId}/announcements`);
}

export async function togglePin(announcementId: string, tournamentId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const ann = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!ann) throw new Error("Not found");

  await prisma.announcement.update({
    where: { id: announcementId },
    data: { pinned: !ann.pinned },
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/announcements`);
}
