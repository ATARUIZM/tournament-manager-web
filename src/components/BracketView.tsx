"use client";

// 1回戦の各ノードに割り当てる高さ（px）
// カード高さ ≈ 67px なので、それより大きい値にすることで隙間ができる
const SLOT_H = 80;

type BracketMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  status: string;
  isBye: boolean;
};

type BracketRound = {
  round: number;
  label: string;
  matches: BracketMatch[];
};

type ThirdPlace = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: string | null;
  status: string;
};

function MatchCard({ match }: { match: BracketMatch }) {
  if (match.isBye) {
    return (
      <div className="bg-white rounded shadow border w-full opacity-60">
        <div className="px-3 py-1.5 border-b text-sm font-medium truncate">
          {match.homeTeam}
        </div>
        <div className="px-3 py-1.5 text-sm text-gray-300">—</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow border w-full">
      <div
        className={`px-3 py-1.5 border-b flex justify-between text-sm ${
          match.status === "FINISHED" && match.winner === match.homeTeam
            ? "font-bold bg-blue-50"
            : ""
        }`}
      >
        <span className="truncate">{match.homeTeam || "—"}</span>
        {match.homeScore !== null && (
          <span className="ml-2 font-mono">{match.homeScore}</span>
        )}
      </div>
      <div
        className={`px-3 py-1.5 flex justify-between text-sm ${
          match.status === "FINISHED" && match.winner === match.awayTeam
            ? "font-bold bg-blue-50"
            : ""
        }`}
      >
        <span className="truncate">{match.awayTeam || "—"}</span>
        {match.awayScore !== null && (
          <span className="ml-2 font-mono">{match.awayScore}</span>
        )}
      </div>
    </div>
  );
}

export function BracketView({
  rounds,
  thirdPlace,
}: {
  rounds: BracketRound[];
  thirdPlace: ThirdPlace | null;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4 items-start">
        {rounds.map((round) => {
          // ラウンドが上がるたびにスロット高さを2倍にする
          // → 次ラウンドのカードが前ラウンドの2枚の中間に来る
          const slotH = Math.pow(2, round.round - 1) * SLOT_H;

          return (
            <div key={round.round} className="flex flex-col w-48">
              <h3 className="text-sm font-bold text-gray-500 mb-2 text-center">
                {round.label}
              </h3>
              {round.matches.map((match) => (
                // スロット：固定高さ + 中央揃えでカードを配置
                <div
                  key={match.id}
                  className="flex items-center"
                  style={{ height: `${slotH}px` }}
                >
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {thirdPlace && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">3位決定戦</h3>
          <div className="bg-white rounded shadow border w-48">
            <div
              className={`px-3 py-1.5 border-b flex justify-between text-sm ${
                thirdPlace.status === "FINISHED" &&
                thirdPlace.winner === thirdPlace.homeTeam
                  ? "font-bold bg-yellow-50"
                  : ""
              }`}
            >
              <span>{thirdPlace.homeTeam}</span>
              {thirdPlace.homeScore !== null && (
                <span className="font-mono">{thirdPlace.homeScore}</span>
              )}
            </div>
            <div
              className={`px-3 py-1.5 flex justify-between text-sm ${
                thirdPlace.status === "FINISHED" &&
                thirdPlace.winner === thirdPlace.awayTeam
                  ? "font-bold bg-yellow-50"
                  : ""
              }`}
            >
              <span>{thirdPlace.awayTeam}</span>
              {thirdPlace.awayScore !== null && (
                <span className="font-mono">{thirdPlace.awayScore}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
