// Demo stand-in for the data team's nudge engine. Pure TypeScript, no React imports.
// The nudge is built from the user's usual transactions (the recommendation engine's top 3):
// it scales their #1 up to close the gap, and only falls back to #2 or #3 when #1 earns no cashback.

import type { LeaderboardEntry, Nudge, Offer } from '../types/leaderboard';
import type { ServiceRecommendation } from '../data/mockRecommendations';
import {
  CASHBACK_RATES,
  FREE_AMOUNT_RULES,
  SERVICE_CHARGES,
  plansFor,
} from '../data/productCatalog';
import { BOARD_SIZE, MIN_ELIGIBLE_CASHBACK, getNextTierTargetRank, getPrizeForRank } from './prizes';
import { formatNaira } from './format';

export const GAP_BUFFER = 0.1;
/** If the person below is closer than this, warn the user to hold their spot. */
export const HOLD_THRESHOLD = 3;
/** Smallest suggestion worth making, so the cashback is noticeable. */
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

const TYPE_WORD = { airtime: 'airtime', data: 'data', cable: '', electricity: '', bank_transfer: 'transfer' };

/** What the user is paying for: one of their top 3, or a service they picked themselves. */
export interface PaySource {
  type: ServiceRecommendation['type'];
  provider: string;
  target: string;
  targetName?: string;
  rank: 1 | 2 | 3 | null;
}

export function cashbackRate(type: PaySource['type']): number {
  return CASHBACK_RATES[type];
}

function labelFor(src: PaySource, planName?: string): string {
  if ((src.type === 'cable' || src.type === 'data') && planName) return `${src.provider} ${planName}`;
  const word = TYPE_WORD[src.type];
  return word ? `${src.provider} ${word}` : src.provider;
}

/** An offer at an exact amount (or plan price), e.g. after the user edits the amount. */
export function offerAt(src: PaySource, spend: number, planName?: string): Offer {
  const plans = plansFor(src.type, src.provider);
  const plan = plans?.find((p) => p.name === planName);
  return {
    type: src.type,
    provider: src.provider,
    target: src.target,
    targetName: src.targetName,
    recRank: src.rank,
    label: labelFor(src, plan?.name),
    planName: plan?.name,
    validity: plan?.validity,
    spend: plan ? plan.price : spend,
    isFixedPrice: !!plans,
    serviceCharge: SERVICE_CHARGES[src.type] ?? 0,
    cashback: round2((plan ? plan.price : spend) * CASHBACK_RATES[src.type]),
  };
}

/** Sizes one service so it earns at least `cashbackNeeded`. Null if it earns no cashback. */
export function sizeOffer(src: PaySource, cashbackNeeded: number): Offer | null {
  const rate = CASHBACK_RATES[src.type];
  if (!rate) return null; // e.g. bank transfers: no amount would ever move them up
  const needed = Math.max(MIN_SPEND, Math.ceil(round2(cashbackNeeded / rate)));
  const plans = plansFor(src.type, src.provider);
  if (plans) {
    const plan = plans.find((p) => p.price >= needed) ?? plans[plans.length - 1];
    return offerAt(src, plan.price, plan.name);
  }
  const rule = FREE_AMOUNT_RULES[src.type] ?? { min: 50, step: 50 };
  return offerAt(src, Math.max(rule.min, Math.ceil(needed / rule.step) * rule.step));
}

/**
 * Builds the transaction that earns at least `cashbackNeeded`, from the user's top 3.
 * Rule: scale up their usual (#1). Fall back to #2 or #3 only when #1 earns no cashback.
 */
export function chooseOffer(recs: ServiceRecommendation[], cashbackNeeded: number): Offer | null {
  for (const rec of recs) {
    const offer = sizeOffer(rec, cashbackNeeded);
    if (offer) return offer;
  }
  return null;
}

/** Short "how" line for the nudge strip. */
export function offerSubline(o: Offer): string {
  if (o.type === 'cable') return `${o.label} renewal, ${nairaWhole(o.spend)}`;
  if (o.type === 'data') return `${o.label} plan, ${nairaWhole(o.spend)}`;
  if (o.type === 'electricity') return `${nairaWhole(o.spend)} ${o.provider} token`;
  return `About ${nairaWhole(o.spend)} in ${o.label}`;
}

/** Phrase used inside the full message sentence. */
function offerPhrase(o: Offer): string {
  if (o.type === 'cable') return `${nairaWhole(o.spend)} on a ${o.label} renewal`;
  if (o.type === 'data') return `${nairaWhole(o.spend)} on the ${o.label} plan`;
  if (o.type === 'electricity') return `${nairaWhole(o.spend)} on ${o.provider}`;
  return `about ${nairaWhole(o.spend)} on ${o.label}`;
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
 * Places the user among everyone else. Ties go against the user. Users under the
 * ₦10 minimum never appear on the board. Off-board users keep their known rank.
 */
export function rankBoard(others: LeaderboardEntry[], user: LeaderboardEntry): RankedBoard {
  const sorted = [...others].sort((a, b) => b.amount - a.amount);
  const eligible = user.amount >= MIN_ELIGIBLE_CASHBACK;
  const firstBelow = sorted.findIndex((o) => user.amount > o.amount);
  const pos = firstBelow === -1 ? sorted.length : firstBelow;

  if (eligible && pos < BOARD_SIZE) {
    const ordered = [...sorted.slice(0, pos), user, ...sorted.slice(pos)].map((e, i) => ({
      ...e,
      rank: i + 1,
    }));
    return { board: ordered.slice(0, BOARD_SIZE), user: ordered[pos], onBoard: true, ordered };
  }

  const ordered = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
  return {
    board: ordered.slice(0, BOARD_SIZE),
    user: { ...user, rank: eligible ? Math.max(user.rank, BOARD_SIZE + 1) : 0 },
    onBoard: false,
    ordered,
  };
}

/** Works out the single most useful nudge for the user, or null if there is nothing to chase. */
export function computeNudge(
  { ordered, user, onBoard }: RankedBoard,
  recs: ServiceRecommendation[],
): Nudge | null {
  // 1. Under the ₦10 minimum (including users with no transactions yet): qualify first.
  if (user.amount < MIN_ELIGIBLE_CASHBACK) {
    const gap = round2(MIN_ELIGIBLE_CASHBACK - user.amount + GAP_BUFFER);
    const offer = chooseOffer(recs, gap);
    if (!offer) return null;
    return {
      state: 'qualify',
      headline: `${naira(gap)} more to qualify`,
      subline: offerSubline(offer),
      message: `Spend ${offerPhrase(offer)} to earn ${naira(offer.cashback)} cashback and pass the ${nairaWhole(MIN_ELIGIBLE_CASHBACK)} minimum for this week's prizes.`,
      gapAmount: gap,
      targetRank: BOARD_SIZE,
      targetPrize: getPrizeForRank(BOARD_SIZE),
      ctaLabel: 'Buy',
      offer,
      cashbackTarget: gap,
    };
  }

  // 2. On the board with someone close behind and a prize drop at stake: hold.
  if (onBoard) {
    const below = ordered[user.rank]; // the person directly below
    const myPrize = getPrizeForRank(user.rank);
    if (below) {
      const lead = round2(user.amount - below.amount);
      const prizeBelow = getPrizeForRank(user.rank + 1);
      if (lead < HOLD_THRESHOLD && prizeBelow < myPrize) {
        const needed = round2(HOLD_THRESHOLD - lead + GAP_BUFFER);
        const offer = chooseOffer(recs, needed);
        if (offer) {
          return {
            state: 'hold',
            headline: `Only ${naira(lead)} ahead of ${ordinal(user.rank + 1)}`,
            subline:
              prizeBelow > 0
                ? `Slip one place and your prize drops to ${nairaWhole(prizeBelow)}`
                : 'Slip one place and you drop off the board',
            message: `You are only ${naira(lead)} ahead of ${ordinal(user.rank + 1)} place. Spend ${offerPhrase(offer)} to protect your ${nairaWhole(myPrize)} prize.`,
            gapAmount: lead,
            targetRank: user.rank,
            targetPrize: myPrize,
            ctaLabel: 'Hold',
            offer,
            cashbackTarget: needed,
          };
        }
      }
    }
  }

  // 3. Chase the next prize tier, or break into the Top 20.
  const targetRank = getNextTierTargetRank(onBoard ? user.rank : BOARD_SIZE + 1);
  if (targetRank === null) return null;
  const target = onBoard ? ordered[targetRank - 1] : ordered[BOARD_SIZE - 1];
  // Board not full yet: the ₦10 minimum is the only bar to clear.
  const targetAmount = target ? target.amount : MIN_ELIGIBLE_CASHBACK;
  const gap = round2(Math.max(targetAmount - user.amount, 0) + GAP_BUFFER);
  const prize = getPrizeForRank(targetRank);
  const offer = chooseOffer(recs, gap);
  if (!offer) return null;
  const offBoard = !onBoard;

  return {
    state: offBoard ? 'break_in' : 'rank_up',
    headline: offBoard
      ? `${naira(gap)} to make the Top 20`
      : `${naira(gap)} to ${ordinal(targetRank)}, win ${nairaWhole(prize)}`,
    subline: offerSubline(offer),
    message: offBoard
      ? `Spend ${offerPhrase(offer)} to earn ${naira(offer.cashback)} cashback and break into the Top 20, where the prize is ${nairaWhole(prize)}.`
      : `Spend ${offerPhrase(offer)} to earn ${naira(offer.cashback)} cashback and move up to ${ordinal(targetRank)} place, where the prize is ${nairaWhole(prize)}.`,
    gapAmount: gap,
    targetRank,
    targetPrize: prize,
    ctaLabel: 'Buy',
    offer,
    cashbackTarget: gap,
  };
}

/** Applies a purchase: adds the cashback it earns and re-ranks. */
export function applyPurchase(
  others: LeaderboardEntry[],
  user: LeaderboardEntry,
  offer: Offer,
): { before: RankedBoard; after: RankedBoard; cashback: number } {
  const before = rankBoard(others, user);
  const after = rankBoard(others, { ...user, amount: round2(user.amount + offer.cashback) });
  return { before, after, cashback: offer.cashback };
}

export interface PositionChange {
  rankBefore: number;
  rankAfter: number;
  onBoardBefore: boolean;
  onBoardAfter: boolean;
  amountAfter: number;
  /** Cashback this payment earns; lets us tell "newly qualified" from "already qualified". */
  cashback?: number;
}

/**
 * The single "where you'll be after this payment" line, one wording per situation:
 * under the minimum, newly qualified, still outside the Top 20, entering the Top 20,
 * moving up a prize tier, moving up within a tier, or holding a spot.
 */
export function positionAfter(c: PositionChange): string {
  const amountBefore = round2(c.amountAfter - (c.cashback ?? 0));
  const prizeAfter = nairaWhole(getPrizeForRank(c.rankAfter));

  if (!c.onBoardAfter) {
    if (c.amountAfter < MIN_ELIGIBLE_CASHBACK) {
      return `you'll still need ${naira(round2(MIN_ELIGIBLE_CASHBACK - c.amountAfter))} more to qualify`;
    }
    return amountBefore < MIN_ELIGIBLE_CASHBACK
      ? "you'll qualify for this week's prizes"
      : "you'll be closer, but still outside the Top 20";
  }

  if (!c.onBoardBefore) {
    return `you'll enter the Top 20 at ${ordinal(c.rankAfter)} and win ${prizeAfter}`;
  }
  if (c.rankAfter < c.rankBefore) {
    const tierUp = getPrizeForRank(c.rankAfter) > getPrizeForRank(c.rankBefore);
    return tierUp
      ? `you'll move from ${ordinal(c.rankBefore)} to ${ordinal(c.rankAfter)} and your prize rises to ${prizeAfter}`
      : `you'll move from ${ordinal(c.rankBefore)} to ${ordinal(c.rankAfter)} and keep your ${prizeAfter} prize`;
  }
  return `you'll stay ${ordinal(c.rankAfter)} with a bigger lead, keeping ${prizeAfter}`;
}
