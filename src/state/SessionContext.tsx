import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { DemoUser } from '../data/demoUsers';

interface SessionState {
  /** The chosen demo user, or null while the user picker is showing. */
  user: DemoUser | null;
  signIn: (user: DemoUser) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionState | null>(null);

/** Not real auth: remembers which of the three staff accounts was picked, for this run only. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const signIn = useCallback((u: DemoUser) => setUser(u), []);
  const signOut = useCallback(() => setUser(null), []);
  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** For screens shown after sign-in, where a user always exists. */
export function useSessionUser(): DemoUser {
  const { user } = useSession();
  if (!user) throw new Error('No signed-in demo user');
  return user;
}
