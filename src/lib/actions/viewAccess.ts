"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { makeAccessToken } from "@/lib/viewAccess";

export async function verifyViewPassword(slug: string, formData: FormData) {
  const password = formData.get("password") as string;

  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    select: { id: true, viewPassword: true },
  });

  if (!tournament?.viewPassword) {
    redirect(`/tournaments/${slug}`);
  }

  if (password !== tournament.viewPassword) {
    throw new Error("パスワードが正しくありません");
  }

  const token = makeAccessToken(tournament.id, tournament.viewPassword);
  const cookieStore = await cookies();
  // セッションCookie（ブラウザを閉じるまで有効）
  cookieStore.set(`tv_${tournament.id}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect(`/tournaments/${slug}`);
}
