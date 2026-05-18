import {
  buildSessionFromTokens,
  type CognitoSession,
  tokensFromCookieHeader,
} from "@/lib/auth/cognito-session";

export async function getCurrentSession(): Promise<CognitoSession | null> {
  if (typeof document === "undefined") return null;
  const { accessToken, idToken } = tokensFromCookieHeader(document.cookie);
  return buildSessionFromTokens(accessToken, idToken);
}
