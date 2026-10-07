// Demo stand-in for the data team's nudge engine. Pure TypeScript, no React imports.
// Assumptions (from the Figma notes): about 2% cashback on airtime and data,
// and a small buffer on every gap so the suggested spend safely clears it.

import type { LeaderboardEntry, Nudge } from '../types/leaderboard';
import { BOARD_SIZE, getNextTierTargetRank, getPrizeForRank } from './prizes';
import { formatNaira } from './format';

export const CASHBACK_RATE = 0.02;
export const GAP_BUFFER = 0.1;
/** If the person below is closer than this, warn the user to hold their spot. */
export const HOLD_THRESHOLD = 3;
export const MIN_SPEND = 250;

const round2 = (n: number) => Math.round(n * 100) / 100;
const naira = (n: number) => formatNaira(n);
const nairaWhole = (n: number) => formatNaira(n, { decimals: false });

export function ordinal(n: number): string {
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`;
  const s = n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${s}`;
}

/** Spend needed to earn `cashback`, rounded up to the nearest ₦50, never below MIN_SPEND. */
export function spendFor(cashback: number): number {
  const raw = round2(cashback / CASHBACK_RATE);
  return Math.max(MIN_SPEND, Math.ceil(raw / 50) * 50);
}

export function cashbackFor(spend: number): number {
  return round2(spend * CASHBACK_RATE);
}

export function productFor(spend: number): string {
  return spend <= 500 ? 'MTN data' : 'MTN airtime';
}

export interface RankedBoard {
  /** Top 20 rows to display, ranks 1 to 20. */
  board: LeaderboardEntry[];
  /** The user with their current rank. */
  user: LeaderboardEntry;
  onBoard: boolean;
  /** Full ordering including the user (when on the board) and anyone pushed off. */
  ordered: LeaderboardEntry[];
}

/**
 * Places the user among everyone else. Ties go against the user: they must have
 * strictly more cashback to pass someone. Off-board users keep their known rank.
 */
export function rankBoard(others: LeaderboardEntry[], user: LeaderboardEntry): RankedBoard {
  const sorted = [...others].sort((a, b) => b.amount - a.amount);
  const firstBelow = sorted.findIndex((o) => user.amount > o.amount);
  const pos = firstBelow === -1 ? sorted.length : firstBelow;

  if (pos < BOARD_SIZE) {
    const ordered = [...sorted.slice(0, pos), user, ...sorted.slice(pos)].map((e, i) => ({
      ...e,
      rank: i + 1,
    }));
    return {
      board: ordered.slice(0, BOARD_SIZE),
      user: ordered[pos],
      onBoard: true,
      ordered,
    };
  }

  const ordered = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  return {
    board: ordered.slice(0, BOARD_SIZE),
    user: { ...user, rank: Math.max(user.rank, BOARD_SIZE + 1) },
    onBoard: false,
    ordered,
  };
}

/** Works out the single most useful nudge for the user, or null if there is nothing to chase. */
export function computeNudge({ ordered, user, onBoard }: RankedBoard): Nudge | null {
  if (onBoard) {
    const below = ordered[user.rank]; // index rank = the person directly below
    const myPrize = getPrizeForRank(user.rank);
    if (below) {
      const lead = round2(user.amount - below.amount);
      const prizeBelow = getPrizeForRank(user.rank + 1);
      if (lead < HOLD_THRESHOLD && prizeBelow < myPrize) {
        const spend = spendFor(HOLD_THRESHOLD - lead + GAP_BUFFER);
        const product = productFor(spend);
        const subline =
          prizeBelow > 0
            ? `Slip one place and your prize drops to ${nairaWhole(prizeBelow)}`
            : 'Slip one place and you drop off the board';
        return {
          state: 'hold',
          headline: `Only ${naira(lead)} ahead of ${ordinal(user.rank + 1)}`,
          subline,
          message: `You are only ${naira(lead)} ahead of ${ordinal(user.rank + 1)} place. Spend about ${nairaWhole(spend)} on ${product} to protect your ${nairaWhole(myPrize)} prize.`,
          gapAmount: lead,
          targetRank: user.rank,
          targetPrize: myPrize,
          ctaLabel: 'Hold',
          suggestedSpend: spend,
          product,
        };
      }
    }
  }

  const targetRank = getNextTierTargetRank(user.rank);
  if (targetRank === null) return null;

  // Person currently holding the target rank (never the user, who sits below it).
  const target = onBoard ? ordered[targetRank - 1] : ordered[BOARD_SIZE - 1];
  if (!target) return null;

  const gap = round2(target.amount - user.amount + GAP_BUFFER);
  const prize = getPrizeForRank(targetRank);
  const spend = spendFor(gap);
  const product = productFor(spend);
  const offBoard = !onBoard;

  return {
    state: offBoard ? 'break_in' : 'rank_up',
    headline: offBoard
      ? `${naira(gap)} to make the Top 20`
      : `${naira(gap)} to ${ordinal(targetRank)}, win ${nairaWhole(prize)}`,
    subline: `About ${nairaWhole(spend)} in ${product}`,
    message: offBoard
      ? `Spend about ${nairaWhole(spend)} on ${product} to earn ${naira(gap)} more cashback and break into the Top 20, where the prize is ${nairaWhole(prize)}.`
      : `Spend about ${nairaWhole(spend)} on ${product} to earn ${naira(gap)} more cashback and move up to ${ordinal(targetRank)} place, where the prize is ${nairaWhole(prize)}.`,
    gapAmount: gap,
    targetRank,
    targetPrize: prize,
    ctaLabel: 'Buy',
    suggestedSpend: spend,
    product,
  };
}

/** Applies a purchase: adds the cashback it earns and re-ranks. */
export function applyPurchase(
  others: LeaderboardEntry[],
  user: LeaderboardEntry,
  spend: number,
): { before: RankedBoard; after: RankedBoard; cashback: number } {
  const before = rankBoard(others, user);
  const cashback = cashbackFor(spend);
  const after = rankBoard(others, { ...user, amount: round2(user.amount + cashback) });
  return { before, after, cashback };
}
