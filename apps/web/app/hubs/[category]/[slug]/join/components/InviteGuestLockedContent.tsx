"use client";

import type { HubTab } from "../../components/hubTypes";
import { LockedHubGuestPreview } from "./LockedHubGuestPreview";

/**
 * Blurred placeholder panel for invite guests browsing locked hub tabs.
 * All sections use the same standard skeleton and height.
 */
export function InviteGuestLockedContent({
  section: _section,
  returnUrl,
}: {
  section: HubTab;
  returnUrl: string;
}) {
  return <LockedHubGuestPreview returnUrl={returnUrl} />;
}
