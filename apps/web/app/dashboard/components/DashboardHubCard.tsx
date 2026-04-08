"use client";

import Link from "next/link";
import { useState } from "react";
import { isUdeetsLogoSrc } from "@/lib/branding";

export type DashboardHubCardData = {
  id: string;
  name: string;
  dpImage: string;
  coverImage: string;
  href: string;
  membersLabel: string;
  visibilityLabel: "Public" | "Private";
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function DashboardImage({
  src,
  alt,
  hubName,
  className,
}: {
  src?: string;
  alt: string;
  hubName?: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const isLogo = src ? isUdeetsLogoSrc(src) : false;

  if (!src || imageFailed || isLogo) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]", className)}>
        <span className="text-2xl font-semibold text-white/60">{hubName?.charAt(0)?.toUpperCase() ?? "H"}</span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn(className, "object-cover")} loading="lazy" onError={() => setImageFailed(true)} />;
}

export function DashboardHubCard({
  hub,
  hasUnread = false,
  isPending = false,
}: {
  hub: DashboardHubCardData;
  hasUnread?: boolean;
  isPending?: boolean;
}) {
  return (
    <Link
      href={hub.href}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-[20px] bg-[var(--ud-bg-card)] transition-transform duration-200 hover:-translate-y-0.5",
        /* Band-style 3D depth shadow */
        "shadow-[0_2px_0_0_rgba(0,0,0,0.06),0_4px_8px_rgba(0,0,0,0.08),0_8px_20px_rgba(0,0,0,0.04)]",
        isPending && "opacity-75",
      )}
    >
      {isPending ? (
        <div className="absolute left-1.5 top-1.5 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          Awaiting Approval
        </div>
      ) : null}

      {/* Cover image — square aspect ratio for Band-style squircle look */}
      <div className="relative aspect-square w-full overflow-hidden">
        <DashboardImage src={hub.coverImage} alt={`${hub.name} hub image`} hubName={hub.name} className="h-full w-full" />

        {/* Bottom gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Hub DP circle overlaid on cover */}
        <div className="absolute bottom-2 left-2.5 z-10 h-8 w-8 overflow-hidden rounded-full border-2 border-white/80 bg-white shadow-sm">
          <DashboardImage src={hub.dpImage} alt={`${hub.name} avatar`} hubName={hub.name} className="h-full w-full" />
        </div>

        {/* Hub name overlaid on cover */}
        <div className="absolute bottom-2 left-12 right-2 z-10">
          <h3
            title={hub.name}
            className="truncate text-[13px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          >
            {hub.name}
          </h3>
        </div>
      </div>

      {/* Bottom bar with members info */}
      <div className="flex items-center justify-between px-2.5 py-2">
        <p className="truncate text-[11px] text-[var(--ud-text-secondary)]">
          {isPending ? "Request pending" : hub.membersLabel}
        </p>
      </div>

      {/* Unread update dot — bottom-right corner with Band-style curved notch */}
      {hasUnread ? (
        <div className="absolute bottom-0 right-0 z-10">
          {/* Small curved notch background */}
          <svg width="22" height="22" viewBox="0 0 22 22" className="absolute bottom-0 right-0">
            <path
              d="M22,22 L22,12 C22,17.523 17.523,22 12,22 Z"
              fill="var(--ud-bg-card, white)"
            />
          </svg>
          <div className="relative mb-1 mr-1 h-3 w-3 rounded-full bg-[#FF3B30] shadow-sm" />
        </div>
      ) : null}
    </Link>
  );
}
