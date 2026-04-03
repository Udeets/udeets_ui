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
        "relative block overflow-hidden rounded-[24px] bg-[var(--ud-bg-card)] shadow-[0_10px_26px_rgba(12,92,87,0.06)] transition-transform duration-200 hover:-translate-y-0.5",
        isPending && "opacity-75",
      )}
    >
      {hasUnread ? (
        <div className="absolute right-1.5 top-1.5 z-10 h-2.5 w-2.5 rounded-full bg-red-500" />
      ) : null}

      {isPending ? (
        <div className="absolute left-1.5 top-1.5 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          Awaiting Approval
        </div>
      ) : null}

      <div className="relative overflow-visible rounded-t-[24px]">
        <div className="aspect-[3/2] w-full">
          <DashboardImage src={hub.coverImage} alt={`${hub.name} hub image`} hubName={hub.name} className="h-full w-full" />
        </div>
        <div className="absolute bottom-0 left-3 z-10 h-10 w-10 translate-y-[30%] overflow-hidden rounded-full border-2 border-white bg-[var(--ud-bg-card)] p-0.5 shadow-sm">
          <div className="h-full w-full overflow-hidden rounded-full">
            <DashboardImage src={hub.dpImage} alt={`${hub.name} avatar`} hubName={hub.name} className="h-full w-full" />
          </div>
        </div>
      </div>

      <div className="px-3.5 pb-3 pt-5">
        <h3
          title={hub.name}
          className="truncate overflow-hidden whitespace-nowrap text-[15px] font-semibold leading-5 text-[var(--ud-text-primary)]"
        >
          {hub.name}
        </h3>
        <p className="mt-1.5 text-xs text-[var(--ud-text-secondary)]">
          {isPending ? "Request pending" : hub.membersLabel}
        </p>
      </div>
    </Link>
  );
}
