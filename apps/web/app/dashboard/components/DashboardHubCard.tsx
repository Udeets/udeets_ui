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
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!src || imageFailed) {
    return (
      <div className={cn("grid place-items-center bg-[#DCEDEA] text-center text-[#0C5C57]", className)}>
        <span className="px-4 text-xs font-semibold tracking-[0.12em] uppercase">uDeets</span>
      </div>
    );
  }

  const isLogo = isUdeetsLogoSrc(src);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn(className, isLogo ? "object-contain" : "object-cover")} loading="lazy" onError={() => setImageFailed(true)} />;
}

export function DashboardHubCard({
  hub,
  onInvite,
  copiedInviteHubId,
}: {
  hub: DashboardHubCardData;
  onInvite: (hub: DashboardHubCardData) => void;
  copiedInviteHubId: string | null;
}) {
  return (
    <Link
      href={hub.href}
      className={cn(
        "block overflow-hidden rounded-[24px] bg-white shadow-[0_10px_26px_rgba(12,92,87,0.06)] transition-transform duration-200 hover:-translate-y-0.5",
      )}
    >
      <div className="relative overflow-visible rounded-t-[24px] bg-[#DCEDEA]">
        <div className="aspect-[3/2] w-full">
          <DashboardImage src={hub.coverImage} alt={`${hub.name} hub image`} className="h-full w-full" />
        </div>
        <div className="absolute bottom-0 left-3 z-10 translate-y-[30%] h-10 w-10 overflow-hidden rounded-full border-2 border-[#DCEDEA] bg-white/95 p-0.5 shadow-sm">
          <div className="h-full w-full overflow-hidden rounded-full bg-white">
            <DashboardImage src={hub.dpImage} alt={`${hub.name} avatar`} className="h-full w-full" />
          </div>
        </div>
      </div>

      <div className="bg-[#DCEDEA] px-3.5 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h3
            title={hub.name}
            className="truncate overflow-hidden whitespace-nowrap text-[15px] font-semibold leading-5 text-[#12312D]"
          >
            {hub.name}
          </h3>
          <span className="mt-0.5 shrink-0 text-[#58706B]" aria-label={hub.visibilityLabel}>
            {hub.visibilityLabel === "Public" ? (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="8" />
                <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
              </svg>
            )}
          </span>
        </div>
        <div className={cn("mt-1.5 flex items-center justify-between gap-3 text-xs text-[#58706B]")}>
          <span className="truncate">{hub.membersLabel}</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onInvite(hub);
            }}
            className="shrink-0 text-xs font-normal text-[#58706B] transition hover:text-[#45625C]"
            aria-label={`Invite to ${hub.name}`}
            title={copiedInviteHubId === hub.id ? "Link copied" : `Invite to ${hub.name}`}
          >
            Invite
          </button>
        </div>
      </div>
    </Link>
  );
}
