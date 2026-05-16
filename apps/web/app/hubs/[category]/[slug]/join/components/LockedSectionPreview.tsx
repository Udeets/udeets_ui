"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, cn } from "../../components/hubUtils";
import { buildAuthUrl } from "@/lib/services/hubs/invite-landing-utils";
import { LOCKED_PLACEHOLDER_HEIGHT_CLASS } from "./placeholder-skeletons";

export function LockedSectionPreview({
  title,
  message,
  returnUrl,
  children,
  className,
  showAuthButtons = true,
}: {
  title: string;
  message: string;
  returnUrl: string;
  children: ReactNode;
  className?: string;
  showAuthButtons?: boolean;
}) {
  return (
    <section
      className={cn(CARD, "relative overflow-hidden", LOCKED_PLACEHOLDER_HEIGHT_CLASS, className)}
      aria-label={title}
    >
      <div
        className="pointer-events-none h-full w-full select-none overflow-hidden blur-[6px] brightness-[0.97] saturate-50"
        aria-hidden
      >
        {children}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center bg-[var(--ud-bg-card)]/55 backdrop-blur-[2px]"
        aria-hidden
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm">
          <Lock className="h-6 w-6 text-[var(--ud-brand-primary)]" strokeWidth={1.75} aria-hidden />
        </div>
        <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--ud-text-secondary)]">{message}</p>
        {showAuthButtons ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Link href={buildAuthUrl(returnUrl, "signin")} className={cn(BUTTON_PRIMARY, "px-5 py-2.5 text-sm")}>
              Sign In
            </Link>
            <Link href={buildAuthUrl(returnUrl, "signup")} className={cn(BUTTON_SECONDARY, "px-5 py-2.5 text-sm")}>
              Sign Up
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
