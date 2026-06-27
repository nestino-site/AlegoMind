"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser, AuthTokens } from "@/lib/types";
import { authApi } from "@/lib/api/auth";

const REFRESH_KEY = "am_rt";
const COOKIE_NAME = "am_at";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** null = still checking, false = no preferences saved, true = onboarding complete */
  hasOnboarded: boolean | null;
  /** Persist tokens received after login / verify-email */
  setAuth: (tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  /** Re-fetches GET /users/me and updates user + hasOnboarded */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  hasOnboarded: null,
  setAuth: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function setCookie(name: string, value: string, maxAgeSec: number) {
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

function getCookie(name: string): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/** GET /users/me's real shape includes matchingPreference, untyped on AuthUser by design. */
type MeResponse = AuthUser & { matchingPreference: unknown | null };

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  // On mount: try to restore user from stored access token. The same
  // /users/me response carries matchingPreference, so hasOnboarded is
  // derived from it directly instead of firing a second request.
  useEffect(() => {
    const cookie = getCookie(COOKIE_NAME);

    if (!cookie) {
      setLoading(false);
      return;
    }

    authApi
      .me(cookie)
      .then((data) => {
        const me = data as MeResponse;
        setUser(me);
        setHasOnboarded(me.matchingPreference !== null);
      })
      .catch(() => {
        deleteCookie(COOKIE_NAME);
        localStorage.removeItem(REFRESH_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const setAuth = useCallback((tokens: AuthTokens) => {
    // accessToken: 15-minute expiry — store in cookie for middleware + API calls
    setCookie(COOKIE_NAME, tokens.accessToken, 15 * 60);
    // refreshToken: 30 days — localStorage only (renewal flow)
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    setUser(tokens.user);

    // The login/verify-email response doesn't include matchingPreference,
    // so a follow-up call is needed to know the seeker's onboarding state.
    setHasOnboarded(null);
    authApi
      .me(tokens.accessToken)
      .then((data) => setHasOnboarded((data as MeResponse).matchingPreference !== null))
      .catch(() => setHasOnboarded(null));
  }, []);

  const refreshUser = useCallback(async () => {
    const cookie = getCookie(COOKIE_NAME);
    if (!cookie) return;
    try {
      const data = await authApi.me(cookie);
      const me = data as MeResponse;
      setUser(me);
      setHasOnboarded(me.matchingPreference !== null);
    } catch {
      /* leave existing state untouched on a transient failure */
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY) ?? "";
    try {
      await authApi.logout(refreshToken);
    } catch { /* ignore network errors on logout */ }
    deleteCookie(COOKIE_NAME);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setHasOnboarded(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hasOnboarded, setAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
