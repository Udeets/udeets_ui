/**
 * Hosts allowed for Next.js <Image> optimization (must stay in sync with `next.config` `images.remotePatterns`).
 */
export function shouldOptimizeRemoteImageSrc(src: string): boolean {
  try {
    const u = new URL(src, "https://noop.local");
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "lh3.googleusercontent.com") return true;
    if (host.endsWith(".supabase.co")) return true;
    return false;
  } catch {
    return false;
  }
}
