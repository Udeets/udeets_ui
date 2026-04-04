"use client";

import { Images, Smile } from "lucide-react";
import { ICON, ImageWithFallback, cn, initials } from "../hubUtils";
import type { ComposerChildFlow } from "./deetTypes";

export function DeetComposerCard({
  isDemoPreview,
  isCreatorAdmin,
  dpImageSrc,
  coverImageSrc,
  recentPhotos,
  hubName,
  onOpenComposer,
}: {
  isDemoPreview: boolean;
  isCreatorAdmin: boolean;
  dpImageSrc: string;
  coverImageSrc: string;
  recentPhotos: string[];
  hubName: string;
  onOpenComposer: (child?: ComposerChildFlow | null) => void;
}) {
  return (
    <section className="w-full rounded-[30px] border border-[var(--ud-brand-light)] bg-[var(--ud-bg-card)] p-4 shadow-sm sm:p-5">
      <div data-demo-target={isDemoPreview ? "hub-composer-section" : undefined} className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[var(--ud-border)] bg-[var(--ud-brand-primary)]">
          <ImageWithFallback
            src={dpImageSrc}
            sources={[dpImageSrc, coverImageSrc, ...recentPhotos]}
            alt={`${hubName} avatar`}
            className="h-full w-full object-cover"
            fallbackClassName="grid h-full w-full place-items-center bg-[var(--ud-brand-primary)] text-sm font-semibold text-[var(--ud-text-primary)]"
            fallback={initials(hubName)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "flex min-h-[170px] flex-col justify-between rounded-[28px] border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
              !isCreatorAdmin && "bg-[var(--ud-bg-subtle)]"
            )}
          >
            <button
              type="button"
              data-demo-target={isDemoPreview ? "hub-composer-input" : undefined}
              disabled={!isCreatorAdmin}
              onClick={() => onOpenComposer()}
              className={cn(
                "flex min-h-[110px] w-full items-start rounded-[22px] px-2 py-2 text-left text-base text-[var(--ud-text-muted)] transition",
                isCreatorAdmin ? "hover:text-[var(--ud-text-secondary)]" : "cursor-not-allowed text-[var(--ud-text-muted)]"
              )}
            >
              What&apos;s on your mind?
            </button>

            <div className="flex items-center justify-between gap-1 pt-3 text-[var(--ud-text-muted)]">
              {[
                { key: "photo" as const, icon: Images, label: "Photo" },
                { key: "emoji" as const, icon: Smile, label: "Sticker" },
              ].map(({ key, icon: ComposerIcon, label }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!isCreatorAdmin}
                  onClick={() => {
                    if (!isCreatorAdmin) return;
                    onOpenComposer(key);
                  }}
                  aria-label={label}
                  title={label}
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-full transition",
                    isCreatorAdmin ? "hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]" : "cursor-not-allowed opacity-50"
                  )}
                >
                  <ComposerIcon className={ICON} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
