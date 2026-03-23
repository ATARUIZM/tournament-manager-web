import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminTournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { id: true, name: true, format: true, slug: true },
  });

  if (!tournament) notFound();

  const tabs = [
    { href: `/admin/tournaments/${id}/matches`, label: "試合" },
    { href: `/admin/tournaments/${id}/teams`, label: "チーム" },
    { href: `/admin/tournaments/${id}/announcements`, label: "お知らせ" },
    { href: `/admin/tournaments/${id}/settings`, label: "設定" },
  ];

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/tournaments"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; 大会一覧
        </Link>
        <h1 className="text-xl font-bold mt-1">{tournament.name}</h1>
        <Link
          href={`/tournaments/${tournament.slug}`}
          target="_blank"
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
        >
          公開ページを確認 →
        </Link>
      </div>
      <nav className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 text-sm border-b-2 border-transparent hover:border-blue-500 hover:text-blue-600 transition -mb-px"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
