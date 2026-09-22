"use client";

import type { User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Profile {
  role: "customer" | "owner";
  name: string;
  phone: string;
  disabled: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  /** True once we know whether someone is signed in AND (if so) their profile has loaded. */
  ready: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  ready: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

async function loadProfile(uid: string): Promise<Profile | null> {
  try {
    const [{ doc, getDoc }, { getDb }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
    const db = getDb();
    if (!db) return null;
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      role: d.role === "owner" ? "owner" : "customer",
      name: typeof d.name === "string" ? d.name : "",
      phone: typeof d.phone === "string" ? d.phone : "",
      disabled: d.disabled === true,
    };
  } catch {
    return null;
  }
}

/**
 * Firebase is imported lazily, after first paint, so it never blocks the initial render
 * of public pages (LCP) and stays out of the critical bundle.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
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
      unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (!u) {
          setUser(null);
          setProfile(null);
          setReady(true);
          return;
        }
        setReady(false);
        setUser(u);
        const p = await loadProfile(u.uid);
        if (cancelled) return;
        if (p?.disabled) {
          // An admin locked this account while the person still has an open session here.
          // Sign out immediately and let /login explain why, instead of leaving a half-alive session.
          try {
            window.sessionStorage.setItem("lp-account-disabled", "1");
          } catch {
            /* private browsing may block sessionStorage; the sign-out itself still happens */
          }
          const { signOut: fbSignOut } = await import("firebase/auth");
          await fbSignOut(auth);
          if (!cancelled) {
            setUser(null);
            setProfile(null);
            setReady(true);
          }
          return;
        }
        setProfile(p);
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

  const refreshProfile = useCallback(async () => {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const u = getFirebaseAuth()?.currentUser;
    if (u) setProfile(await loadProfile(u.uid));
  }, []);

  const value = useMemo(() => ({ user, profile, ready, signOut, refreshProfile }), [user, profile, ready, signOut, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
