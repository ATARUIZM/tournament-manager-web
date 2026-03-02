"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TournamentFormat } from "@prisma/client";

async function checkPermission(tournamentId: string, userId: string) {
  const perm = await prisma.permission.findFirst({
    where: { tournamentId, userId },
  });
  if (!perm) throw new Error("Unauthorized");
}

export async function createTournament(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const format = formData.get("format") as TournamentFormat;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const thirdPlaceMatch = formData.get("thirdPlaceMatch") === "on";

  const tournament = await prisma.tournament.create({
    data: {
      name,
      slug,
      description: description || null,
      format,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      thirdPlaceMatch,
      permissions: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  redirect(`/admin/tournaments/${tournament.id}/settings`);
}

export async function updateTournament(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(id, user.id);

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const format = formData.get("format") as TournamentFormat;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const thirdPlaceMatch = formData.get("thirdPlaceMatch") === "on";
  const winPoints = parseInt(formData.get("winPoints") as string) || 3;
  const drawPoints = parseInt(formData.get("drawPoints") as string) || 1;
  const losePoints = parseInt(formData.get("losePoints") as string) || 0;
  const isPublic = formData.get("isPublic") !== "false";
  const viewPassword = (formData.get("viewPassword") as string) || null;

  await prisma.tournament.update({
    where: { id },
    data: {
      name,
      slug,
      description: description || null,
      format,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      thirdPlaceMatch,
      winPoints,
      drawPoints,
      losePoints,
      isPublic,
      viewPassword,
    },
  });

  revalidatePath(`/admin/tournaments/${id}/settings`);
}

export async function deleteTournament(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await checkPermission(id, user.id);

  await prisma.tournament.delete({ where: { id } });
  redirect("/admin/tournaments");
}
