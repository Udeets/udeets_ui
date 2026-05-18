export type CognitoUser = {
  id: string;
  email: string | null;
  user_metadata: Record<string, unknown>;
};

export type CognitoSession = {
  access_token: string;
  id_token: string | null;
  expires_at: number | null;
  user: CognitoUser;
};

const ACCESS_COOKIE_KEYS = [
  "udeets_access_token",
  "cognito_access_token",
  "access_token",
] as const;

const ID_COOKIE_KEYS = ["udeets_id_token", "cognito_id_token", "id_token"] as const;

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
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed;
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
  idToken: string | null;
} {
  let accessToken: string | null = null;
  let idToken: string | null = null;

  for (const key of ACCESS_COOKIE_KEYS) {
    accessToken = readCookieValue(cookieHeader, key);
    if (accessToken) break;
  }
  for (const key of ID_COOKIE_KEYS) {
    idToken = readCookieValue(cookieHeader, key);
    if (idToken) break;
  }
  return { accessToken, idToken };
}

export function buildSessionFromTokens(
  accessToken: string | null,
  idToken: string | null,
): CognitoSession | null {
  if (!accessToken) return null;
  const claims = decodeJwtPayload(idToken || accessToken) ?? {};
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
    id_token: idToken,
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
