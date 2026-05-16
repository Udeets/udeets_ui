"use client";

import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, cn } from "../../components/hubUtils";
import { buildAuthUrl } from "@/lib/services/hubs/invite-landing-utils";

export function JoinHubCTA({
  hubName,
  isPublicHub,
  isAuthenticated,
  membership,
  isJoining,
  joinError,
  joinSuccess,
  returnUrl,
  hubDestination,
  hubPageUrl,
  onJoin,
  tokenInvalid,
}: {
  hubName: string;
  isPublicHub: boolean;
  isAuthenticated: boolean;
  membership: "guest" | "active" | "pending" | "invited";
  isJoining: boolean;
  joinError: string | null;
  joinSuccess: "joined" | "requested" | null;
  returnUrl: string;
  hubDestination: string;
  hubPageUrl: string;
  onJoin: () => void;
  tokenInvalid: boolean;
}) {
  if (membership === "active" || joinSuccess === "joined") {
    return (
      <div className={cn(CARD, "flex items-center gap-3 border-emerald-200 bg-emerald-50/80 p-4")}>
        <Check className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
        <p className="text-sm font-medium text-emerald-900">Opening {hubName}…</p>
        <Loader2 className="ml-auto h-4 w-4 animate-spin text-emerald-700" aria-hidden />
      </div>
    );
  }

  if (membership === "pending" || membership === "invited" || joinSuccess === "requested") {
    return (
      <div className={cn(CARD, "border-amber-200 bg-amber-50/60 p-5 text-center")}>
        <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">Request sent</h3>
        <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
          Your request to join <span className="font-medium">{hubName}</span> is pending admin approval.
        </p>
        <Link href={hubPageUrl} className={cn(BUTTON_SECONDARY, "mt-4 inline-flex px-5 py-2.5 text-sm")}>
          View hub
        </Link>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={cn(CARD, "p-5 text-center sm:p-6")}>
        <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">
          {isPublicHub ? "Join this community" : "Request access"}
        </h3>
        <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
          {isPublicHub
            ? `Sign in to join ${hubName} and see posts, chat, events, and more.`
            : `Sign in to request access to ${hubName}. An admin will review your request.`}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link href={buildAuthUrl(returnUrl, "signin")} className={cn(BUTTON_PRIMARY, "px-5 py-2.5 text-sm")}>
            Sign In
          </Link>
          <Link href={buildAuthUrl(returnUrl, "signup")} className={cn(BUTTON_SECONDARY, "px-5 py-2.5 text-sm")}>
            Sign Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(CARD, "p-5 text-center sm:p-6")}>
      <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">
        {isPublicHub ? "Ready to join?" : "Request access"}
      </h3>
      <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
        {isPublicHub
          ? `Become a member of ${hubName} to unlock posts, chat, and community features.`
          : `Send a request to join ${hubName}. You'll get access once an admin approves.`}
      </p>
      {tokenInvalid ? (
        <p className="mt-2 text-xs text-amber-700">Your invite link may be invalid; you can still try to join.</p>
      ) : null}
      {joinError ? <p className="mt-3 text-sm text-red-600">{joinError}</p> : null}
      <button
        type="button"
        disabled={isJoining}
        onClick={onJoin}
        className={cn(BUTTON_PRIMARY, "mt-5 inline-flex min-w-[10rem] items-center justify-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60")}
      >
        {isJoining ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {isJoining ? "Please wait…" : isPublicHub ? "Join hub" : "Request to join"}
      </button>
    </div>
  );
}
