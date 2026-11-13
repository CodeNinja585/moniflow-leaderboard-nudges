import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { scenarios, ScenarioKey } from '../data/mockLeaderboard';
import { recommendations, ServiceRecommendation } from '../data/mockRecommendations';
import { buildLiveBoard } from '../lib/liveBoard';
import { weekEndsIn } from '../lib/week';
import { WEEK_NUMBER, WEEK_ROWS } from '../data/leaderboardWeek';
import { BOARD_SIZE } from '../lib/prizes';
import { useSessionUser } from './SessionContext';
import { applyPurchase, computeNudge, rankBoard, RankedBoard } from '../lib/nudgeEngine';
import type { PurchaseOutcome } from '../components/PurchaseSheet';
import type { LeaderboardEntry, Nudge, Offer } from '../types/leaderboard';

/** 'live' is the data team's weekly export with the signed-in user's real row; the rest are fixed demo states. */
export type DemoMode = 'live' | ScenarioKey;
export const SCENARIO_ORDER: DemoMode[] = ['live', 'rankUp', 'hold', 'breakIn', 'underMin', 'empty'];

interface DemoState {
  mode: DemoMode;
  week: { weekNumber: number; endsIn: string };
  /** Changes when the board needs a fresh mount: a demo state switch or a new live rank. */
  boardKey: string;
  /** Increments on every scenario switch, so screens can reset scroll and caches. */
  scenarioVersion: number;
  cycleScenario: () => void;
  others: LeaderboardEntry[];
  /** Everyone outside the Top 20, including people under the minimum. Not shown yet, kept for later. */
  rest: LeaderboardEntry[];
  user: LeaderboardEntry;
  ranked: RankedBoard;
  recs: ServiceRecommendation[];
  nudge: Nudge | null;
  simulate: (offer: Offer) => PurchaseOutcome;
  /** Adds a paid offer's cashback to the user, from any screen. */
  completePurchase: (offer: Offer) => void;
}

const DemoContext = createContext<DemoState | null>(null);

/** One shared demo user, so a purchase on Home moves them on the Leaderboard too. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const profile = useSessionUser();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioVersion, setScenarioVersion] = useState(0);
  const mode = SCENARIO_ORDER[scenarioIndex];

  const base = useMemo(() => {
    if (mode === 'live') {
      const live = buildLiveBoard(WEEK_ROWS, profile.id, profile);
      return {
        others: live.others,
        belowMinimum: live.belowMinimum,
        user: live.user,
        recs: recommendations.breakIn,
        week: { weekNumber: WEEK_NUMBER, endsIn: weekEndsIn() },
      };
    }
    const sc = scenarios[mode];
    return {
      others: sc.entries.filter((e) => !e.isCurrentUser),
      belowMinimum: [] as LeaderboardEntry[],
      user: { ...sc.currentUser, name: profile.name, initials: profile.initials },
      recs: recommendations[mode],
      week: sc,
    };
  }, [mode, profile]);

  // Saved transactions carry the demo's sample name; show the signed-in user's name instead.
  const recs = useMemo(
    () => base.recs.map((r) => (r.targetName === 'MASUD HASHIM' ? { ...r, targetName: profile.name.toUpperCase() } : r)),
    [base.recs, profile],
  );

  // Cashback from purchases sits on top of the base; it resets whenever the base changes.
  const baseKey = mode;
  const [bonus, setBonus] = useState({ key: baseKey, amount: 0 });
  const extra = bonus.key === baseKey ? bonus.amount : 0;
  const { others } = base;
  const user = useMemo(
    () => ({ ...base.user, amount: Math.round((base.user.amount + extra) * 100) / 100 }),
    [base.user, extra],
  );
  const ranked = useMemo(() => rankBoard(others, user, base.belowMinimum), [others, user, base.belowMinimum]);
  const nudge = useMemo(() => computeNudge(ranked, recs), [ranked, recs]);
  const rest = useMemo(
    () => [...ranked.ordered.slice(BOARD_SIZE).filter((e) => !e.isCurrentUser), ...base.belowMinimum],
    [ranked, base.belowMinimum],
  );

  const cycleScenario = useCallback(() => {
    setScenarioIndex((i) => (i + 1) % SCENARIO_ORDER.length);
    setScenarioVersion((v) => v + 1);
  }, []);

  const simulate = useCallback(
    (offer: Offer): PurchaseOutcome => {
      const { before, after, cashback } = applyPurchase(others, user, offer);
      return {
        cashback,
        amountAfter: after.user.amount,
        rankBefore: before.user.rank,
        rankAfter: after.user.rank,
        onBoardBefore: before.onBoard,
        onBoardAfter: after.onBoard,
      };
    },
    [others, user],
  );

  const completePurchase = useCallback(
    (offer: Offer) => setBonus({ key: baseKey, amount: extra + offer.cashback }),
    [baseKey, extra],
  );

  const value = useMemo(
    () => ({ mode, week: base.week, boardKey: String(scenarioVersion), scenarioVersion, cycleScenario, others, rest, user, ranked, recs, nudge, simulate, completePurchase }),
    [mode, base.week, scenarioVersion, cycleScenario, others, rest, user, ranked, recs, nudge, simulate, completePurchase],
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
