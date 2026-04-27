"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { HubFeedItemKind } from "@/lib/hub-content";
import { shouldOptimizeRemoteImageSrc } from "@/lib/images/remote-feed-image";
import { ImageWithFallback, cn } from "../hubUtils";

function dedupeImageUrls(urls: (string | undefined)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of urls) {
    const t = u?.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

type FeedMediaProps = {
  imageUrls: string[];
  alt: string;
  feedKind?: HubFeedItemKind;
  /** `hero`: single large tile; `mosaic`: multi-tile grid */
  sizesVariant?: "hero" | "mosaic";
  onOpen: (index: number) => void;
  className?: string;
};

const TILE_ROUND = "overflow-hidden rounded-lg";

function FeedImage({
  src,
  sources,
  alt,
  sizes,
  className,
  objectFit = "cover",
}: {
  src: string;
  sources: string[];
  alt: string;
  sizes: string;
  className: string;
  objectFit?: "cover" | "contain";
}) {
  const optimize = shouldOptimizeRemoteImageSrc(src);
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";

  if (optimize) {
    return (
      <span className={cn("absolute inset-0 block", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} className={fitClass} loading="lazy" />
      </span>
    );
  }

  return (
    <span className={cn("absolute inset-0 block", className)}>
      <ImageWithFallback
        src={src}
        sources={sources}
        alt={alt}
        className={cn("h-full w-full", fitClass)}
        fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-light)]/20 text-sm text-[var(--ud-text-muted)]"
        fallback="Image unavailable"
        loading="lazy"
      />
    </span>
  );
}

function MediaTile({
  src,
  sources,
  alt,
  sizes,
  onClick,
  className,
  overlay,
  objectFit = "cover",
}: {
  src: string;
  sources: string[];
  alt: string;
  sizes: string;
  onClick: () => void;
  className?: string;
  overlay?: ReactNode;
  objectFit?: "cover" | "contain";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative block min-h-0 min-w-0 bg-[var(--ud-bg-subtle)] text-left outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--ud-brand-primary)] motion-reduce:transition-none",
        TILE_ROUND,
        className
      )}
    >
      <FeedImage src={src} sources={sources} alt={alt} sizes={sizes} className="" objectFit={objectFit} />
      {overlay}
    </button>
  );
}

/**
 * Hub feed media: single adaptive hero, 2-up, 3-up (1 large + 2), or 2×2 with +N overlay.
 * Uses `next/image` when the URL host is allowlisted (see `lib/images/remote-feed-image.ts` + `next.config`).
 */
export function FeedMedia({
  imageUrls,
  alt,
  feedKind,
  sizesVariant = "hero",
  onOpen,
  className,
}: FeedMediaProps) {
  const urls = dedupeImageUrls(imageUrls);
  if (!urls.length) return null;

  // Single-image hero: use portrait-friendly framing for photo posts and for
  // typical text/image deets ("post", etc.). A 16:9 box + object-contain made
  // portrait shots look letterboxed and narrower than the hub card width.
  // Polls keep the wider frame when a single asset is passed through.
  const isSingleImage = urls.length === 1;
  const isPhotoKind =
    feedKind === "photo" || (isSingleImage && feedKind !== "poll");
  const shell = cn("mt-3 px-3 sm:px-4", className);

  const heroSizes = "(max-width: 640px) 92vw, (max-width: 1024px) 640px, 720px";
  const mosaicSizes =
    sizesVariant === "mosaic"
      ? "(max-width: 640px) 45vw, (max-width: 1024px) 280px, 320px"
      : "(max-width: 640px) 46vw, 360px";

  if (urls.length === 1) {
    return (
      <div className={shell}>
        <MediaTile
          src={urls[0]!}
          sources={urls}
          alt={alt}
          sizes={heroSizes}
          onClick={() => onOpen(0)}
          objectFit="contain"
          className={cn(
            "max-h-[min(72vw,420px)] w-full shadow-inner",
            isPhotoKind ? "aspect-[4/5] max-h-[480px] sm:aspect-[3/4]" : "aspect-video max-h-[360px]"
          )}
        />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className={cn(shell, "grid grid-cols-2 gap-1 sm:gap-1.5")} style={{ height: "clamp(180px, 28vw, 260px)" }}>
        <MediaTile
          src={urls[0]!}
          sources={[urls[0]!]}
          alt={alt}
          sizes={mosaicSizes}
          onClick={() => onOpen(0)}
          className="h-full w-full"
        />
        <MediaTile
          src={urls[1]!}
          sources={[urls[1]!]}
          alt={alt}
          sizes={mosaicSizes}
          onClick={() => onOpen(1)}
          className="h-full w-full"
        />
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className={cn(shell, "grid h-[clamp(200px,32vw,280px)] grid-cols-2 gap-1 sm:gap-1.5")}>
        <MediaTile
          src={urls[0]!}
          sources={[urls[0]!]}
          alt={alt}
          sizes="(max-width: 640px) 46vw, 360px"
          onClick={() => onOpen(0)}
          className="row-span-2 h-full w-full"
        />
        <MediaTile
          src={urls[1]!}
          sources={[urls[1]!]}
          alt={alt}
          sizes={mosaicSizes}
          onClick={() => onOpen(1)}
          className="h-full w-full"
        />
        <MediaTile
          src={urls[2]!}
          sources={[urls[2]!]}
          alt={alt}
          sizes={mosaicSizes}
          onClick={() => onOpen(2)}
          className="h-full w-full"
        />
      </div>
    );
  }

  const shown = urls.slice(0, 4);
  const extra = urls.length - 4;
  return (
    <div className={cn(shell, "grid h-[clamp(200px,32vw,280px)] grid-cols-2 grid-rows-2 gap-1 sm:gap-1.5")}>
      {shown.map((url, i) => (
        <MediaTile
          key={`${url}-${i}`}
          src={url}
          sources={[url]}
          alt={i === 3 && extra > 0 ? `${alt} and ${extra} more` : alt}
          sizes={mosaicSizes}
          onClick={() => onOpen(i)}
          className="h-full w-full"
          overlay={
            i === 3 && extra > 0 ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 text-lg font-bold text-white">
                +{extra}
              </div>
            ) : null
          }
        />
      ))}
    </div>
  );
}
