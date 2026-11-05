import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getRecommendations, RecommendResult } from '../api/recommend';

type Status = 'loading' | 'done';

interface RecommendationsState {
  userId: string;
  setUserId: (id: string) => void;
  status: Status;
  result: RecommendResult | null;
  /** True while a refresh is running, so pull-to-refresh can show its spinner. */
  refreshing: boolean;
  refresh: () => void;
}

const Ctx = createContext<RecommendationsState | null>(null);

/**
 * One API response for Home and Leaderboard. Fetched when the app opens, when the user changes,
 * and when the app returns from the background. Screens reuse it; only pull-to-refresh calls again.
 */
export function RecommendationsProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('masud');
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [refreshing, setRefreshing] = useState(false);
  // Ignore answers from a call that a newer call has replaced.
  const latest = useRef(0);

  const load = useCallback(
    async (id: string, mode: 'initial' | 'refresh') => {
      const call = ++latest.current;
      if (mode === 'initial') setStatus('loading');
      else setRefreshing(true);
      const r = await getRecommendations(id);
      if (call !== latest.current) return;
      setResult(r);
      setStatus('done');
      setRefreshing(false);
    },
    [],
  );

  useEffect(() => {
    load(userId, 'initial');
  }, [userId, load]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load(userId, 'refresh');
    });
    return () => sub.remove();
  }, [userId, load]);

  const refresh = useCallback(() => load(userId, 'refresh'), [userId, load]);

  const value = useMemo(
    () => ({ userId, setUserId, status, result, refreshing, refresh }),
    [userId, status, result, refreshing, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRecommendations(): RecommendationsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRecommendations must be used inside RecommendationsProvider');
  return ctx;
}
