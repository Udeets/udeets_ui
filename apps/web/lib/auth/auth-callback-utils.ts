/** Safe in-app path for post-login redirect (blocks open redirects). */
export function sanitizeAuthNextPath(next: string | null | undefined): string {
  const target = next?.trim() || "";
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }
  return target;
}

/** Build return path from current URL, stripping OAuth query params. */
export function buildNextFromRequestUrl(url: URL): string {
  if (url.pathname === "/auth") {
    const redirectTo = url.searchParams.get("redirect_to") || url.searchParams.get("redirect");
    if (redirectTo) return sanitizeAuthNextPath(redirectTo);
  }

  const params = new URLSearchParams(url.searchParams);
  for (const key of ["code", "access_token", "refresh_token", "error", "error_description", "type"]) {
    params.delete(key);
  }
  const qs = params.toString();
  return sanitizeAuthNextPath(`${url.pathname}${qs ? `?${qs}` : ""}`);
}

export function buildAuthCallbackHref(origin: string, code: string, next: string): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("code", code);
  callback.searchParams.set("next", sanitizeAuthNextPath(next));
  return callback.toString();
}
