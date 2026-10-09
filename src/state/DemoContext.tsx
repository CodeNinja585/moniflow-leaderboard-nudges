import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { scenarios, ScenarioKey } from '../data/mockLeaderboard';
import { recommendations, ServiceRecommendation } from '../data/mockRecommendations';
import { applyPurchase, computeNudge, rankBoard, RankedBoard } from '../lib/nudgeEngine';
import type { PurchaseOutcome } from '../components/PurchaseSheet';
import type { LeaderboardEntry, Nudge, Offer } from '../types/leaderboard';

export const SCENARIO_ORDER: ScenarioKey[] = ['rankUp', 'hold', 'breakIn', 'underMin', 'empty'];

interface DemoState {
  scenarioKey: ScenarioKey;
  /** Increments on every scenario switch, so screens can reset scroll and caches. */
  scenarioVersion: number;
  cycleScenario: () => void;
  others: LeaderboardEntry[];
  user: LeaderboardEntry;
  ranked: RankedBoard;
  recs: ServiceRecommendation[];
  nudge: Nudge | null;
  simulate: (offer: Offer) => PurchaseOutcome;
  /** Adds a paid offer's cashback to the user, from any screen. */
  completePurchase: (offer: Offer) => void;
}

const DemoContext = createContext<DemoState | null>(null);

/** One shared demo user, so a purchase on Home moves Masud on the Leaderboard too. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioVersion, setScenarioVersion] = useState(0);
  const scenarioKey = SCENARIO_ORDER[scenarioIndex];
  const scenario = scenarios[scenarioKey];
  const [user, setUser] = useState<LeaderboardEntry>(scenario.currentUser);

  const others = useMemo(() => scenario.entries.filter((e) => !e.isCurrentUser), [scenario]);
  const ranked = useMemo(() => rankBoard(others, user), [others, user]);
  const recs = recommendations[scenarioKey];
  const nudge = useMemo(() => computeNudge(ranked, recs), [ranked, recs]);

  const cycleScenario = useCallback(() => {
    const next = (scenarioIndex + 1) % SCENARIO_ORDER.length;
    setUser(scenarios[SCENARIO_ORDER[next]].currentUser);
    setScenarioIndex(next);
    setScenarioVersion((v) => v + 1);
  }, [scenarioIndex]);

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

  const completePurchase = useCallback((offer: Offer) => {
    setUser((u) => ({ ...u, amount: Math.round((u.amount + offer.cashback) * 100) / 100 }));
  }, []);

  const value = useMemo(
    () => ({ scenarioKey, scenarioVersion, cycleScenario, others, user, ranked, recs, nudge, simulate, completePurchase }),
    [scenarioKey, scenarioVersion, cycleScenario, others, user, ranked, recs, nudge, simulate, completePurchase],
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
