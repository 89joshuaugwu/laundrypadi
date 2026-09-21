"use client";

import type { User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface AuthState {
  user: User | null;
  ready: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false, signOut: async () => {} });

/**
 * Firebase is imported lazily, after first paint, so it never blocks the initial render
 * of public pages (LCP) and stays out of the critical bundle.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ getFirebaseAuth }, { onAuthStateChanged }] = await Promise.all([
        import("@/lib/firebase"),
        import("firebase/auth"),
      ]);
      if (cancelled) return;
      const auth = getFirebaseAuth();
      if (!auth) {
        setReady(true);
        return;
      }
      unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    const [{ getFirebaseAuth }, { signOut: fbSignOut }] = await Promise.all([
      import("@/lib/firebase"),
      import("firebase/auth"),
    ]);
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
  }, []);

  const value = useMemo(() => ({ user, ready, signOut }), [user, ready, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
