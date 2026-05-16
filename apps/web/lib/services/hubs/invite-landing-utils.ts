export function buildInviteJoinReturnUrl(
  category: string,
  slug: string,
  opts?: { deetId?: string; joinToken?: string },
): string {
  const params = new URLSearchParams();
  if (opts?.deetId) params.set("deet", opts.deetId);
  if (opts?.joinToken) params.set("t", opts.joinToken);
  const qs = params.toString();
  return qs ? `/hubs/${category}/${slug}/join?${qs}` : `/hubs/${category}/${slug}/join`;
}

export function buildHubDestinationUrl(category: string, slug: string, deetId?: string): string {
  return deetId
    ? `/hubs/${category}/${slug}?tab=Posts&focus=${encodeURIComponent(deetId)}`
    : `/hubs/${category}/${slug}`;
}

export function buildAuthUrl(returnUrl: string, mode: "signin" | "signup" = "signin"): string {
  const params = new URLSearchParams();
  params.set("redirect_to", returnUrl);
  if (mode === "signup") params.set("mode", "signup");
  return `/auth?${params.toString()}`;
}

export function readPostAuthRedirect(searchParams: URLSearchParams): string {
  const target =
    searchParams.get("redirect_to")?.trim() || searchParams.get("redirect")?.trim() || "";
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/dashboard";
  }
  return target;
}

