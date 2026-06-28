function required(name: string, value: string | undefined): string {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    throw new Error(`${name} is not configured.`);
  }
  return trimmed;
}

export function getGoogleClientId(): string {
  return required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
}

export function getGoogleRedirectUri(origin?: string): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) return configured;
  const base = origin || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/auth/callback`;
}

export function buildGoogleAuthorizeUrl(state: string, origin?: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
