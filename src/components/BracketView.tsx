"use client";

import { Fragment } from "react";

const SLOT_H = 80;      // px: 1回戦の各ノードに割り当てる高さ
const CONNECTOR_W = 28; // px: ラウンド間のSVGコネクター幅
const CARD_W = 192;     // px: カード幅 (= w-48)

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
          {match.homeTeam || "—"}
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

/**
 * ラウンド r と r+1 の間に描くコネクターSVG
 *
 * 各ノードのスロット高さ = 2^(fromRound-1) * SLOT_H
 * ペア (pos 2i, pos 2i+1) → 次ラウンドの pos i へ接続
 *
 *   カードA ───┐
 *              │   (垂直)
 *              ├─── カードC（次ラウンド）
 *              │
 *   カードB ───┘
 */
function ConnectorSVG({
  fromRound,
  matchCount,
}: {
  fromRound: number;
  matchCount: number;
}) {
  const slotH = Math.pow(2, fromRound - 1) * SLOT_H;
  const totalH = matchCount * slotH;
  const cx = CONNECTOR_W / 2; // 垂直線のX座標（SVG中央）

  const d = Array.from({ length: Math.floor(matchCount / 2) }, (_, pairIdx) => {
    const i = pairIdx * 2;
    const y1 = (i + 0.5) * slotH;       // 上のカード中央Y
    const y2 = (i + 1.5) * slotH;       // 下のカード中央Y
    const midY = (i + 1) * slotH;       // 次ラウンドカードの中央Y（= y1とy2の中点）
    return [
      `M 0 ${y1} H ${cx}`,              // 上カード → 垂直線
      `M ${cx} ${y1} V ${y2}`,          // 垂直線（上下を結ぶ）
      `M 0 ${y2} H ${cx}`,              // 下カード → 垂直線
      `M ${cx} ${midY} H ${CONNECTOR_W}`, // 垂直線中点 → 次ラウンドカード
    ].join(" ");
  }).join(" ");

  return (
    <svg
      width={CONNECTOR_W}
      height={totalH}
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="#9ca3af"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
      {/* ラベル行（ラウンド名） */}
      <div className="flex min-w-max mb-2">
        {rounds.map((round, idx) => (
          <Fragment key={round.round}>
            <div
              className="text-center shrink-0"
              style={{ width: `${CARD_W}px` }}
            >
              <h3 className="text-sm font-bold text-gray-500">{round.label}</h3>
            </div>
            {idx < rounds.length - 1 && (
              <div style={{ width: `${CONNECTOR_W}px`, flexShrink: 0 }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* カード列 + SVGコネクター */}
      <div className="flex min-w-max pb-4 items-start">
        {rounds.map((round, idx) => {
          const slotH = Math.pow(2, round.round - 1) * SLOT_H;
          return (
            <Fragment key={round.round}>
              {/* カード列 */}
              <div className="flex flex-col shrink-0" style={{ width: `${CARD_W}px` }}>
                {round.matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center"
                    style={{ height: `${slotH}px` }}
                  >
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>

              {/* 次ラウンドへのコネクター */}
              {idx < rounds.length - 1 && (
                <ConnectorSVG
                  fromRound={round.round}
                  matchCount={round.matches.length}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* 3位決定戦 */}
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
