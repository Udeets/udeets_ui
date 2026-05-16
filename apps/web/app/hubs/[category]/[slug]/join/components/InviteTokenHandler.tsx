"use client";

import { AlertCircle } from "lucide-react";
import { CARD, cn } from "../../components/hubUtils";

/**
 * Surfaces invalid/expired invite tokens without blocking the preview experience.
 */
export function InviteTokenHandler({
  showInvalidBanner,
}: {
  showInvalidBanner: boolean;
}) {
  if (!showInvalidBanner) return null;

  return (
    <div
      className={cn(CARD, "mb-4 flex items-start gap-3 border-amber-200 bg-amber-50/80 p-4")}
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-amber-900">Invite link unavailable</p>
        <p className="mt-1 text-sm text-amber-800/90">
          This link may be expired or disabled. You can still preview the hub below, but joining may require a new
          invite from the admin.
        </p>
      </div>
    </div>
  );
}
