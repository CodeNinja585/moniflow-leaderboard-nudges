// Builds the live board from the data team's weekly export. Pure TypeScript, no React imports.
//
// `others` holds everyone at or above the minimum, ready for rankBoard to place the user among them.
// People under the minimum can never appear on the board, so they are kept apart in `belowMinimum`.

import type { WeekRow } from '../data/leaderboardWeek';
import type { LeaderboardEntry } from '../types/leaderboard';
import { MIN_ELIGIBLE_CASHBACK } from './prizes';

export interface LiveBoard {
  others: LeaderboardEntry[];
  /** The signed-in user with their real cashback. Rank 0 until rankBoard places them. */
  user: LeaderboardEntry;
  /** Everyone else under the minimum, highest first. Not shown, kept for later. */
  belowMinimum: LeaderboardEntry[];
}

const toEntry = (r: WeekRow): LeaderboardEntry => ({
  rank: 0,
  name: r.name,
  initials: r.initials,
  amount: r.cashback,
  isCurrentUser: false,
});

export function buildLiveBoard(
  rows: WeekRow[],
  username: string,
  profile: { name: string; initials: string },
): LiveBoard {
  const me = rows.find((r) => r.username === username);
  const rest = rows.filter((r) => r.username !== username);
  return {
    others: rest.filter((r) => r.cashback >= MIN_ELIGIBLE_CASHBACK).map(toEntry),
    belowMinimum: rest.filter((r) => r.cashback < MIN_ELIGIBLE_CASHBACK).map(toEntry),
    // A user missing from the export has no transactions this week.
    user: { rank: 0, name: profile.name, initials: profile.initials, amount: me?.cashback ?? 0, isCurrentUser: true },
  };
}
