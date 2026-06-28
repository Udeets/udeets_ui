export type AuthUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  expires_at: number | null;
  user: AuthUser;
};

const ACCESS_COOKIE_KEYS = ["udeets_access_token", "access_token"] as const;

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  if (typeof window === "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }
  return atob(padded);
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const raw = decodeBase64Url(parts[1]);
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readCookieValue(cookieHeader: string, key: string): string | null {
  for (const item of cookieHeader.split(";")) {
    const [name, ...rest] = item.trim().split("=");
    if (name === key) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function tokensFromCookieHeader(cookieHeader: string): {
  accessToken: string | null;
} {
  for (const key of ACCESS_COOKIE_KEYS) {
    const token = readCookieValue(cookieHeader, key);
    if (token) return { accessToken: token };
  }
  return { accessToken: null };
}

export function buildSessionFromToken(accessToken: string | null): AuthSession | null {
  if (!accessToken) return null;
  const claims = decodeJwtPayload(accessToken) ?? {};
  const sub = typeof claims.sub === "string" ? claims.sub : "";
  if (!sub) return null;
  const email = typeof claims.email === "string" ? claims.email : null;
  const fullName =
    (typeof claims.name === "string" && claims.name) ||
    (typeof claims.given_name === "string" && claims.given_name) ||
    "";
  const avatar = typeof claims.picture === "string" ? claims.picture : "";
  const exp = typeof claims.exp === "number" ? claims.exp : null;
  return {
    access_token: accessToken,
    expires_at: exp,
    user: {
      id: sub,
      email,
      user_metadata: {
        full_name: fullName,
        avatar_url: avatar,
      },
    },
  };
}

/** @deprecated Use AuthSession */
export type CognitoSession = AuthSession;

/** @deprecated Use AuthUser */
export type CognitoUser = AuthUser;

/** @deprecated Use buildSessionFromToken */
export function buildSessionFromTokens(
  accessToken: string | null,
  _idToken?: string | null,
): AuthSession | null {
  return buildSessionFromToken(accessToken);
}
