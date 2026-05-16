"use client";

import { Globe, Lock, MapPin } from "lucide-react";
import type { HubColorTheme } from "@/lib/hub-color-themes";
import { ImageWithFallback, cn, initials } from "../../components/hubUtils";

export function HubPreviewHero({
  hubName,
  tagline,
  categoryLabel,
  locationLabel,
  visibilityLabel,
  coverImageSrc,
  dpImageSrc,
  coverImageOffsetY = 50,
  dpImageOffsetY = 50,
  accentTheme,
}: {
  hubName: string;
  tagline?: string;
  categoryLabel: string;
  locationLabel?: string;
  visibilityLabel: "Public" | "Private";
  coverImageSrc: string;
  dpImageSrc: string;
  coverImageOffsetY?: number;
  dpImageOffsetY?: number;
  accentTheme: HubColorTheme;
}) {
  const VisibilityIcon = visibilityLabel === "Public" ? Globe : Lock;
  const coverStyle = { objectPosition: `50% ${coverImageOffsetY}%` } as React.CSSProperties;
  const dpStyle = { objectPosition: `50% ${dpImageOffsetY}%` } as React.CSSProperties;

  return (
    <header
      className="overflow-hidden rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm"
      style={{ backgroundColor: accentTheme.wash }}
    >
      <div className="relative h-[180px] overflow-hidden sm:h-[220px]" style={{ backgroundColor: accentTheme.wash }}>
        {coverImageSrc ? (
          <ImageWithFallback
            src={coverImageSrc}
            alt=""
            className="h-full w-full object-cover"
            style={coverStyle}
            fallbackClassName="h-full w-full"
            fallback={<div className="h-full w-full" style={{ backgroundColor: accentTheme.surface }} />}
          />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${accentTheme.surface}, ${accentTheme.wash})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
      </div>

      <div className="relative px-4 pb-5 sm:px-6">
        <div className="-mt-12 flex flex-col items-center sm:-mt-14 sm:flex-row sm:items-end sm:gap-5">
          <div
            className="relative z-10 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-[var(--ud-bg-card)] shadow-md sm:h-28 sm:w-28"
            style={{ backgroundColor: accentTheme.surface }}
          >
            {dpImageSrc ? (
              <ImageWithFallback
                src={dpImageSrc}
                alt=""
                className="h-full w-full object-cover"
                style={dpStyle}
                fallbackClassName="grid h-full w-full place-items-center text-lg font-semibold"
                fallback={
                  <span className="text-[var(--ud-brand-primary)]" style={{ color: accentTheme.primary }}>
                    {initials(hubName)}
                  </span>
                }
              />
            ) : (
              <div
                className="grid h-full w-full place-items-center text-xl font-semibold"
                style={{ color: accentTheme.primary, backgroundColor: accentTheme.surface }}
              >
                {initials(hubName)}
              </div>
            )}
          </div>

          <div className="mt-3 min-w-0 flex-1 text-center sm:mt-0 sm:pb-1 sm:text-left">
            <h1 className="text-xl font-bold tracking-tight text-[var(--ud-text-primary)] sm:text-2xl">{hubName}</h1>
            {tagline ? (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--ud-text-secondary)]">{tagline}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--ud-text-muted)] sm:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ud-bg-subtle)] px-2.5 py-1 font-medium">
                {categoryLabel}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
                  visibilityLabel === "Public"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-secondary)]",
                )}
              >
                <VisibilityIcon className="h-3.5 w-3.5" aria-hidden />
                {visibilityLabel}
              </span>
              {locationLabel ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {locationLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
