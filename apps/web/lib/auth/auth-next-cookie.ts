import { sanitizeAuthNextPath } from "@/lib/auth/auth-callback-utils";

const COOKIE_NAME = "udeets_auth_next";
const MAX_AGE_SEC = 600;

/** Persist post-login path so hosted OAuth can always return to `/auth/callback`. */
export function setAuthNextCookie(nextPath: string) {
  if (typeof document === "undefined") return;
  const safe = sanitizeAuthNextPath(nextPath);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(safe)}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
}

export function readAuthNextCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return sanitizeAuthNextPath(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export function clearAuthNextCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/** Exact OAuth callback URL registered with Google. */
export function getAuthCallbackUrl(origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}/auth/callback`;
}
