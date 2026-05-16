"use client";

import { LockedSectionPreview } from "./LockedSectionPreview";
import { StandardLockedPlaceholder } from "./placeholder-skeletons";

export const LOCKED_HUB_GUEST_MESSAGE =
  "Sign in or create an account to view this hub's members, posts, and updates.";

/** Standard blurred lock panel for private hub guests (all tabs + About photos). */
export function LockedHubGuestPreview({
  returnUrl,
  showAuthButtons = true,
  className,
}: {
  returnUrl: string;
  showAuthButtons?: boolean;
  className?: string;
}) {
  return (
    <LockedSectionPreview
      title="Private section"
      message={LOCKED_HUB_GUEST_MESSAGE}
      returnUrl={returnUrl}
      showAuthButtons={showAuthButtons}
      className={className}
    >
      <StandardLockedPlaceholder />
    </LockedSectionPreview>
  );
}
