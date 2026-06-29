/** Resolve bearer token for direct FastAPI WebSocket auth (HttpOnly cookie fallback). */
export async function getChatAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch("/api/auth/access-token", { credentials: "include", cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { accessToken?: string | null };
    return body.accessToken ?? null;
  } catch {
    return null;
  }
}

/** @deprecated Use getChatAccessToken() — access token is HttpOnly. */
export function getChatAccessTokenFromCookies(): string | null {
  return null;
}
