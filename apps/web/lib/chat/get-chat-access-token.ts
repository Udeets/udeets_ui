/** Resolve Cognito bearer token from document cookies for direct FastAPI WebSocket auth. */
export function getChatAccessTokenFromCookies(): string | null {
  if (typeof document === "undefined") return null;
  const cookieHeader = document.cookie;
  const keys = [
    "udeets_access_token",
    "udeets_id_token",
    "cognito_access_token",
    "cognito_id_token",
    "access_token",
    "id_token",
  ];
  for (const item of cookieHeader.split(";")) {
    const [name, ...rest] = item.trim().split("=");
    if (!keys.includes(name)) continue;
    const value = decodeURIComponent(rest.join("="));
    if (value) return value;
  }
  return null;
}
