"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resolveHubJoinToken } from "@/lib/services/hubs/hub-join-link-client";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { buildHubDestinationUrl } from "@/lib/services/hubs/invite-landing-utils";

export type InviteJoinPhase = "initializing" | "redirecting_member" | "ready";

/**
 * Invite link routing: guests see the preview landing; signed-in users go to the standard hub page.
 */
export function useInviteJoinFlow({
  category,
  slug,
  joinToken,
  deetId,
}: {
  category: string;
  slug: string;
  joinToken: string;
  deetId: string;
}) {
  const router = useRouter();
  const { status: authStatus, user } = useAuthSession();
  const hubDestination = buildHubDestinationUrl(category, slug, deetId || undefined);

  const [phase, setPhase] = useState<InviteJoinPhase>("initializing");
  const [tokenInvalid, setTokenInvalid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (joinToken) {
        const resolved = await resolveHubJoinToken(joinToken);
        if (cancelled) return;
        if (!resolved?.isValid || resolved.category !== category || resolved.slug !== slug) {
          setTokenInvalid(true);
        }
      }

      if (authStatus === "loading") return;

      if (authStatus === "unauthenticated") {
        setPhase("ready");
        return;
      }

      if (authStatus !== "authenticated" || !user?.id) return;

      setPhase("redirecting_member");
      router.replace(hubDestination);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [authStatus, user?.id, category, slug, joinToken, hubDestination, router]);

  return {
    phase,
    tokenInvalid,
    hubDestination,
  };
}
