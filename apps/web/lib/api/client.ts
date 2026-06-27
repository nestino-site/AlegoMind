const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

/** Read the access token from cookie (client-side only). */
function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("am_at="))
    ?.split("=")[1];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

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
