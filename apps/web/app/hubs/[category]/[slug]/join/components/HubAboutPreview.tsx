"use client";

import { Globe, MapPin } from "lucide-react";
import type { HubColorTheme } from "@/lib/hub-color-themes";
import { CARD, ImageWithFallback, cn, displayLinkValue } from "../../components/hubUtils";

export function HubAboutPreview({
  hubName,
  description,
  locationLabel,
  website,
  galleryImages,
  accentTheme,
}: {
  hubName: string;
  description: string;
  locationLabel?: string;
  website?: string;
  galleryImages?: string[];
  accentTheme: HubColorTheme;
}) {
  const photos = (galleryImages ?? []).filter(Boolean).slice(0, 6);

  return (
    <section className={cn(CARD, "overflow-hidden")} aria-labelledby="hub-about-preview-title">
      <div
        className="border-b border-[var(--ud-border-subtle)] px-4 py-3 sm:px-5"
        style={{ backgroundColor: accentTheme.wash }}
      >
        <h2 id="hub-about-preview-title" className="text-sm font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
          About
        </h2>
      </div>
      <div className="space-y-4 px-4 py-5 sm:px-5">
        <p className="text-sm leading-relaxed text-[var(--ud-text-secondary)] whitespace-pre-wrap">
          {description || `${hubName} is on uDeets. Join to connect with the community.`}
        </p>

        {(locationLabel || website) && (
          <ul className="space-y-2 text-sm text-[var(--ud-text-secondary)]">
            {locationLabel ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ud-brand-primary)]" aria-hidden />
                <span>{locationLabel}</span>
              </li>
            ) : null}
            {website ? (
              <li className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ud-brand-primary)]" aria-hidden />
                <span className="break-all">{displayLinkValue(website)}</span>
              </li>
            ) : null}
          </ul>
        )}

        {photos.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Photos</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {photos.map((src, i) => (
                <div key={`${src}-${i}`} className="aspect-square overflow-hidden rounded-lg border border-[var(--ud-border-subtle)]">
                  <ImageWithFallback
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full bg-[var(--ud-bg-subtle)]"
                    fallback={null}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
