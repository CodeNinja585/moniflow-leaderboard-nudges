export type Track = 'cashback' | 'referrals' | 'volume';

export type NudgeState = 'rank_up' | 'break_in' | 'hold' | 'qualify';

/**
 * Nudge shown under the current user's row.
 * `message` matches the slides' contract (one ready-made string from the backend).
 * The structured fields are what the Figma design needs; proposed to the data team.
 */
export interface Nudge {
  state: NudgeState;
  message: string;
  headline: string;
  subline?: string;
  /** Naira for cashback; a count for referrals and volume. */
  gapAmount: number;
  targetRank: number;
  targetPrize: number;
  ctaLabel: string;
  /** The transaction that closes the gap, built from the user's usual transactions. */
  offer: Offer;
}

/** A ready-to-pay transaction: the user's usual service, sized to close their gap. */
export interface Offer {
  type: 'airtime' | 'data' | 'cable' | 'electricity' | 'bank_transfer';
  provider: string;
  target: string;
  targetName?: string;
  /** Which of the user's top 3 this came from (1 = their usual). */
  recRank: 1 | 2 | 3;
  /** e.g. "MTN airtime", "Ikeja Electric", "DStv Padi". */
  label: string;
  planName?: string;
  validity?: string;
  /** Exact price for fixed plans; rounded suggestion for free amounts. */
  spend: number;
  isFixedPrice: boolean;
  serviceCharge: number;
  cashback: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  /** Naira for cashback; a count for referrals and volume. */
  amount: number;
  isCurrentUser: boolean;
}

export interface TrackSummary {
  track: Track;
  /** null when the user is not ranked on this track. */
  userRank: number | null;
}
