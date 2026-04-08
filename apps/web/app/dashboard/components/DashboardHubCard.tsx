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

/**
 * Band-style hub tile: large rounded-square DP image + hub name below.
 * No cover photo on the dashboard — just the DP as the main visual.
 */
export function DashboardHubCard({
  hub,
  hasUnread = false,
  isPending = false,
}: {
  hub: DashboardHubCardData;
  hasUnread?: boolean;
  isPending?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const isLogo = hub.dpImage ? isUdeetsLogoSrc(hub.dpImage) : false;
  const showFallback = !hub.dpImage || imgFailed || isLogo;

  return (
    <Link href={hub.href} className="flex flex-col items-center gap-1.5">
      {/* Rounded-square DP — Band-style squircle with 3D depth */}
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[22%]",
          /* 3D layered shadow: bottom edge highlight + medium blur + soft ambient */
          "shadow-[0_2px_0_0_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.05)]",
          isPending && "opacity-60",
        )}
      >
        {showFallback ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)]">
            <span className="text-3xl font-bold text-white/70">
              {hub.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hub.dpImage}
            alt={hub.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}

        {/* Pending badge */}
        {isPending ? (
          <div className="absolute inset-x-0 bottom-0 bg-amber-500/90 py-0.5 text-center text-[9px] font-semibold text-white">
            Pending
          </div>
        ) : null}

        {/* Unread dot — bottom-right with curved notch */}
        {hasUnread ? (
          <div className="absolute bottom-0 right-0 z-10">
            <svg width="20" height="20" viewBox="0 0 20 20" className="absolute bottom-0 right-0">
              <path
                d="M20,20 L20,10 C20,15.523 15.523,20 10,20 Z"
                fill="var(--ud-bg-surface, #f5f5f5)"
              />
            </svg>
            <div className="relative mb-[3px] mr-[3px] h-2.5 w-2.5 rounded-full bg-[#FF3B30]" />
          </div>
        ) : null}
      </div>

      {/* Hub name below the icon — Band style */}
      <span
        title={hub.name}
        className="w-full truncate text-center text-[12px] font-medium leading-tight text-[var(--ud-text-primary)]"
      >
        {hub.name}
      </span>
    </Link>
  );
}
