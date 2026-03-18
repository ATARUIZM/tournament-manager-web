import type { BracketMatch, BracketRound, ThirdPlace } from "@/components/BracketView";

type EntryInput = {
  teamId: string;
  teamName: string;
  isBye: boolean;
};

export function computeBracketPreview(
  entries: EntryInput[],
  thirdPlaceMatch: boolean
): { rounds: BracketRound[]; thirdPlace: ThirdPlace | null } {
  const n = entries.length;
  if (n < 2) return { rounds: [], thirdPlace: null };

  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
  const totalByes = bracketSize - n;
  const totalRounds = Math.log2(bracketSize);
  const matchesInRound1 = bracketSize / 2;

  // BYE 割り当て（generateBracket と同じロジック）
  const manualByes = entries.filter((e) => e.isBye);
  const nonByes = entries.filter((e) => !e.isBye);

  let byeTeams: EntryInput[];
  let playTeams: EntryInput[];

  if (totalByes >= manualByes.length) {
    const extraByes = totalByes - manualByes.length;
    byeTeams = [...manualByes, ...nonByes.slice(0, extraByes)];
    playTeams = nonByes.slice(extraByes);
  } else {
    byeTeams = manualByes.slice(0, totalByes);
    playTeams = [...manualByes.slice(totalByes), ...nonByes];
  }

  const roundLabel = (round: number, max: number) => {
    if (round === max) return "決勝";
    if (round === max - 1) return "準決勝";
    if (round === max - 2) return "準々決勝";
    return `${round}回戦`;
  };

  // 1回戦
  const round1Matches: BracketMatch[] = [];
  for (let pos = 0; pos < matchesInRound1; pos++) {
    if (pos < totalByes) {
      round1Matches.push({
        id: `bye-${pos}`,
        homeTeam: byeTeams[pos]?.teamName || "",
        awayTeam: "",
        homeScore: null,
        awayScore: null,
        winner: null,
        status: "FINISHED",
        isBye: true,
      });
    } else {
      const playIdx = (pos - totalByes) * 2;
      round1Matches.push({
        id: `r1-${pos}`,
        homeTeam: playTeams[playIdx]?.teamName || "",
        awayTeam: playTeams[playIdx + 1]?.teamName || "",
        homeScore: null,
        awayScore: null,
        winner: null,
        status: "SCHEDULED",
        isBye: false,
      });
    }
  }

  const rounds: BracketRound[] = [
    { round: 1, label: roundLabel(1, totalRounds), matches: round1Matches },
  ];

  // 2回戦のBYEシード配置（generateBracket と同じロジック）
  const round2Home: { [pos: number]: string } = {};
  const round2Away: { [pos: number]: string } = {};
  for (let pos = 0; pos < totalByes; pos++) {
    const nextPos = Math.floor(pos / 2);
    if (pos % 2 === 0) {
      round2Home[nextPos] = byeTeams[pos]?.teamName || "";
    } else {
      round2Away[nextPos] = byeTeams[pos]?.teamName || "";
    }
  }

  // 2回戦以降
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    const roundMatches: BracketMatch[] = [];
    for (let pos = 0; pos < matchesInRound; pos++) {
      roundMatches.push({
        id: `r${round}-${pos}`,
        homeTeam: round === 2 ? (round2Home[pos] || "") : "",
        awayTeam: round === 2 ? (round2Away[pos] || "") : "",
        homeScore: null,
        awayScore: null,
        winner: null,
        status: "SCHEDULED",
        isBye: false,
      });
    }
    rounds.push({ round, label: roundLabel(round, totalRounds), matches: roundMatches });
  }

  const thirdPlace: ThirdPlace | null =
    thirdPlaceMatch && totalRounds >= 2
      ? {
          homeTeam: "",
          awayTeam: "",
          homeScore: null,
          awayScore: null,
          winner: null,
          status: "SCHEDULED",
        }
      : null;

  return { rounds, thirdPlace };
}
