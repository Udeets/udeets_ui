import {
  buildSessionFromToken,
  type AuthSession,
  tokensFromCookieHeader,
} from "@/lib/auth/session";

export async function getCurrentSession(): Promise<AuthSession | null> {
  if (typeof document === "undefined") return null;
  const { accessToken } = tokensFromCookieHeader(document.cookie);
  return buildSessionFromToken(accessToken);
}
