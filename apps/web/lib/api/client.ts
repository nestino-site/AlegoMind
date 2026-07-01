const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

const COOKIE_NAME = "am_at";
const REFRESH_KEY  = "am_rt";

// ── Token helpers (client-side only) ─────────────────────────────────────────

function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
}

function setAccessToken(token: string) {
  document.cookie = `${COOKIE_NAME}=${token}; Path=/; SameSite=Lax; Max-Age=${15 * 60}`;
}

function clearAuth() {
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0`;
  try { localStorage.removeItem(REFRESH_KEY); } catch { /* SSR guard */ }
}

// ── Silent token refresh ──────────────────────────────────────────────────────

// Coalesce concurrent 401s into a single refresh request
let _refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const rt =
        typeof localStorage !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
      if (!rt) return false;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) return false;

      const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
      setAccessToken(tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── Core request ──────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Auto-refresh once on 401 — skip auth endpoints to prevent loops
  if (res.status === 401 && !_isRetry && !path.startsWith("/auth/")) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    // Refresh failed — clear session and redirect to login
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/autentificare";
    }
    throw new Error("Sesiunea a expirat. Te rugam sa te autentifici din nou.");
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string, init?: RequestInit) =>
    request<T>(path, { method: "GET", ...init }),

  post:   <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body), ...init }),

  patch:  <T>(path: string, body: unknown, init?: RequestInit) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body), ...init }),

  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { method: "DELETE", ...init }),
};
