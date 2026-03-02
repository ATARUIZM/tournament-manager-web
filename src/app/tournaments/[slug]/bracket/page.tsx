import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { BracketView } from "@/components/BracketView";

export const dynamic = "force-dynamic";

export default async function BracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      bracketNodes: {
        include: {
          match: {
            include: { homeTeam: true, awayTeam: true, winner: true },
          },
          seedTeam: true,
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      },
    },
  });

  if (!tournament) notFound();
  if (tournament.format !== "TOURNAMENT") redirect(`/tournaments/${slug}`);

  if (tournament.bracketNodes.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-4">トーナメント表</h2>
        <p className="text-gray-500">まだトーナメント表が生成されていません。</p>
      </div>
    );
  }

  const nodes = tournament.bracketNodes.filter((n) => !n.isThirdPlace);
  const thirdPlaceNode = tournament.bracketNodes.find((n) => n.isThirdPlace);

  const maxRound = Math.max(...nodes.map((n) => n.round));

  // ラウンドごとにグルーピング
  const rounds: Map<number, typeof tournament.bracketNodes> = new Map();
  for (const node of nodes) {
    const list = rounds.get(node.round) || [];
    list.push(node);
    rounds.set(node.round, list);
  }

  const roundLabels = (round: number, max: number) => {
    if (round === max) return "決勝";
    if (round === max - 1) return "準決勝";
    if (round === max - 2) return "準々決勝";
    return `${round}回戦`;
  };

  const toMatchData = (n: (typeof tournament.bracketNodes)[number]) => ({
    id: n.id,
    homeTeam: n.isBye
      ? (n.seedTeam?.name || "")
      : (n.match?.homeTeam?.name || ""),
    awayTeam: n.isBye ? "" : (n.match?.awayTeam?.name || ""),
    homeScore: n.match?.homeScore ?? null,
    awayScore: n.match?.awayScore ?? null,
    winner: n.match?.winner?.name || null,
    status: n.match?.status || (n.isBye ? "FINISHED" : "SCHEDULED"),
    isBye: n.isBye,
  });

  // Round 1 にBYEがある場合：実試合のみ「予選」として分離し、Round 2以降をメイン表示
  const round1Nodes = rounds.get(1) ?? [];
  const hasFirstRoundByes = round1Nodes.some((n) => n.isBye);

  const preliminary = hasFirstRoundByes
    ? round1Nodes.filter((n) => !n.isBye).map(toMatchData)
    : undefined;

  const mainRoundEntries = Array.from(rounds.entries()).filter(
    ([r]) => !hasFirstRoundByes || r >= 2
  );

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">トーナメント表</h2>
      <BracketView
        rounds={mainRoundEntries.map(([round, roundNodes]) => ({
          round,
          label: roundLabels(round, maxRound),
          matches: roundNodes.map(toMatchData),
        }))}
        thirdPlace={
          thirdPlaceNode?.match
            ? {
                homeTeam: thirdPlaceNode.match.homeTeam?.name || "",
                awayTeam: thirdPlaceNode.match.awayTeam?.name || "",
                homeScore: thirdPlaceNode.match.homeScore,
                awayScore: thirdPlaceNode.match.awayScore,
                winner: thirdPlaceNode.match.winner?.name || null,
                status: thirdPlaceNode.match.status,
              }
            : null
        }
        preliminary={preliminary}
      />
    </div>
  );
}
