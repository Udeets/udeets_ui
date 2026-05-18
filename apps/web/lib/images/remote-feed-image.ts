import { isAllowedRemoteImageHost } from "@/lib/images/media-image-hosts";

/**
 * Hosts allowed for Next.js <Image> optimization (must stay in sync with `next.config` `images.remotePatterns`).
 */
export function shouldOptimizeRemoteImageSrc(src: string): boolean {
  try {
    const u = new URL(src, "https://noop.local");
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return isAllowedRemoteImageHost(u.hostname);
  } catch {
    return false;
  }
}
