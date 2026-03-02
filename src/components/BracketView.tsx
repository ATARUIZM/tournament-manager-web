"use client";

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

export function BracketView({
  rounds,
  thirdPlace,
  preliminary,
}: {
  rounds: BracketRound[];
  thirdPlace: ThirdPlace | null;
  preliminary?: BracketMatch[];
}) {
  return (
    <div>
      {preliminary && preliminary.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-500 mb-3">予選</h3>
          <div className="flex flex-wrap gap-3">
            {preliminary.map((match) => (
              <div key={match.id} className="bg-white rounded shadow border w-48">
                <div
                  className={`px-3 py-1.5 border-b flex justify-between text-sm ${
                    match.status === "FINISHED" && match.winner === match.homeTeam
                      ? "font-bold bg-blue-50"
                      : ""
                  }`}
                >
                  <span className="truncate">{match.homeTeam}</span>
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
                  <span className="truncate">{match.awayTeam}</span>
                  {match.awayScore !== null && (
                    <span className="ml-2 font-mono">{match.awayScore}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">↓ 勝者はメインブラケットへ進みます</p>
        </div>
      )}
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {rounds.map((round) => (
          <div key={round.round} className="flex flex-col">
            <h3 className="text-sm font-bold text-gray-500 mb-3 text-center">
              {round.label}
            </h3>
            <div
              className="flex flex-col justify-around flex-1 gap-2"
              style={{
                paddingTop: `${(Math.pow(2, round.round - 1) - 1) * 24}px`,
                gap: `${Math.pow(2, round.round) * 12}px`,
              }}
            >
              {round.matches.map((match) =>
                match.isBye ? (
                  <div
                    key={match.id}
                    className="bg-white rounded shadow border w-48 opacity-50"
                  >
                    <div className="px-3 py-1.5 border-b flex justify-between text-sm font-bold">
                      <span className="truncate">{match.homeTeam}</span>
                    </div>
                    <div className="px-3 py-1.5 text-sm text-gray-300">—</div>
                  </div>
                ) : (
                  <div
                    key={match.id}
                    className="bg-white rounded shadow border w-48"
                  >
                    <div
                      className={`px-3 py-1.5 border-b flex justify-between text-sm ${
                        match.status === "FINISHED" &&
                        match.winner === match.homeTeam
                          ? "font-bold bg-blue-50"
                          : ""
                      }`}
                    >
                      <span className="truncate">{match.homeTeam}</span>
                      {match.homeScore !== null && (
                        <span className="ml-2 font-mono">{match.homeScore}</span>
                      )}
                    </div>
                    <div
                      className={`px-3 py-1.5 flex justify-between text-sm ${
                        match.status === "FINISHED" &&
                        match.winner === match.awayTeam
                          ? "font-bold bg-blue-50"
                          : ""
                      }`}
                    >
                      <span className="truncate">{match.awayTeam}</span>
                      {match.awayScore !== null && (
                        <span className="ml-2 font-mono">{match.awayScore}</span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
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
    </div>
  );
}
