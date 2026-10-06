// Weekly prize tiers from the live Moniflow app. Only the Top 20 win.

export const BOARD_SIZE = 20;
export const MIN_ELIGIBLE_CASHBACK = 10;

export interface PrizeTier {
  fromRank: number;
  toRank: number;
  prize: number;
}

export const PRIZE_TIERS: readonly PrizeTier[] = [
  { fromRank: 1, toRank: 1, prize: 2500 },
  { fromRank: 2, toRank: 2, prize: 2000 },
  { fromRank: 3, toRank: 3, prize: 1500 },
  { fromRank: 4, toRank: 10, prize: 650 },
  { fromRank: 11, toRank: 15, prize: 500 },
  { fromRank: 16, toRank: 20, prize: 400 },
];

export function getTierForRank(rank: number): PrizeTier | null {
  return PRIZE_TIERS.find((t) => rank >= t.fromRank && rank <= t.toRank) ?? null;
}

/** Prize for a rank, or 0 when the rank is off the board. */
export function getPrizeForRank(rank: number): number {
  return getTierForRank(rank)?.prize ?? 0;
}

/**
 * True when ranks `upper` and `lower` (lower = upper + 1) fall in different prize tiers.
 * Used to draw the "₦650 above" divider between two rows.
 */
export function isTierBoundary(upper: number, lower: number): boolean {
  const a = getTierForRank(upper);
  const b = getTierForRank(lower);
  return a !== null && a !== b;
}

/** Best rank in the next tier up, or null if the user is already 1st. */
export function getNextTierTargetRank(rank: number): number | null {
  if (rank > BOARD_SIZE) return BOARD_SIZE;
  const tier = getTierForRank(rank);
  if (!tier || tier.fromRank === 1) return null;
  return tier.fromRank - 1;
}
