import type { RemotePattern } from "next/dist/shared/lib/image-config";

const GOOGLE_AVATAR_HOST = "lh3.googleusercontent.com";

/** Public CDN / bucket base for S3 media (same value as API `S3_PUBLIC_BASE_URL`). */
export function getMediaPublicBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_MEDIA_PUBLIC_BASE_URL?.trim() ||
    process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export function getMediaPublicHostname(): string | null {
  const base = getMediaPublicBaseUrl();
  if (!base) return null;
  try {
    return new URL(base).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedRemoteImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === GOOGLE_AVATAR_HOST) return true;
  const mediaHost = getMediaPublicHostname();
  if (mediaHost && host === mediaHost) return true;
  if (host.endsWith(".amazonaws.com")) return true;
  return false;
}

export function buildMediaImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    {
      protocol: "https",
      hostname: GOOGLE_AVATAR_HOST,
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "**.amazonaws.com",
      pathname: "/**",
    },
  ];

  const base = getMediaPublicBaseUrl();
  if (base) {
    try {
      const u = new URL(base);
      const protocol = u.protocol === "http:" ? "http" : "https";
      patterns.push({
        protocol,
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/**",
      });
    } catch {
      // ignore invalid base URL at build time
    }
  }

  return patterns;
}
