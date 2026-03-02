import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TournamentPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    select: { name: true, slug: true, format: true },
  });

  if (!tournament) notFound();

  const navItems = [
    { href: `/tournaments/${slug}`, label: "トップ" },
    { href: `/tournaments/${slug}/schedule`, label: "日程" },
    ...(tournament.format === "LEAGUE"
      ? [{ href: `/tournaments/${slug}/standings`, label: "順位表" }]
      : [{ href: `/tournaments/${slug}/bracket`, label: "トーナメント表" }]),
    { href: `/tournaments/${slug}/announcements`, label: "お知らせ" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">{tournament.name}</h1>
        </div>
        <nav className="bg-blue-800">
          <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm text-blue-100 hover:bg-blue-600 whitespace-nowrap transition rounded-t"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 py-4">
        大会管理システム
      </footer>
    </div>
  );
}
