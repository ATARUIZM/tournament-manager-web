import { prisma } from "@/lib/prisma";

export async function GET() {
  const envCheck = {
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    prismaTest: null as string | null,
  };

  try {
    await prisma.tournament.count();
    envCheck.prismaTest = "ok";
  } catch (e) {
    envCheck.prismaTest = String(e);
  }

  return Response.json(envCheck);
}
