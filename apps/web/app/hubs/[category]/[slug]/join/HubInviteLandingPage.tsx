"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";
import type { HubRecord } from "@/lib/hubs";
import { getHubColorTheme } from "@/lib/hub-color-themes";
import {
  buildHubDestinationUrl,
  buildInviteJoinReturnUrl,
} from "@/lib/services/hubs/invite-landing-utils";
import { useAuthSession } from "@/services/auth/useAuthSession";
import { categoryMetaFor } from "../components/hubUtils";
import { HubAboutPreview } from "./components/HubAboutPreview";
import { HubPreviewHero } from "./components/HubPreviewHero";
import { InviteTokenHandler } from "./components/InviteTokenHandler";
import { JoinHubCTA } from "./components/JoinHubCTA";
import { LockedChatPreview } from "./components/LockedChatPreview";
import { LockedEventsPreview } from "./components/LockedEventsPreview";
import { LockedMembersPreview } from "./components/LockedMembersPreview";
import { LockedPhotosPreview } from "./components/LockedPhotosPreview";
import { LockedPostsPreview } from "./components/LockedPostsPreview";
import { MobileAppDownloadPrompt } from "./components/MobileAppDownloadPrompt";
import { useInviteJoinFlow } from "./hooks/useInviteJoinFlow";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
      {children}
    </h2>
  );
}

/**
 * Marketing / preview landing for guests opening an invite or join link.
 * Signed-in users are redirected to the normal hub page before this renders.
 */
function HubInviteLandingContent({
  hub,
  category,
  slug,
}: {
  hub: HubRecord;
  category: string;
  slug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus } = useAuthSession();
  const deetId = searchParams.get("deet") || "";
  const joinToken = searchParams.get("t") || "";

  const isPublicHub = hub.visibility === "Public";
  const accentTheme = getHubColorTheme(hub.accentColor);
  const categoryMeta = categoryMetaFor(hub.category);
  const returnUrl = buildInviteJoinReturnUrl(category, slug, {
    deetId: deetId || undefined,
    joinToken: joinToken || undefined,
  });
  const hubDestination = buildHubDestinationUrl(category, slug, deetId || undefined);

  const { phase, tokenInvalid } = useInviteJoinFlow({
    category,
    slug,
    joinToken,
    deetId,
  });

  // Belt-and-suspenders: send any authenticated session to the real hub layout.
  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace(hubDestination);
    }
  }, [authStatus, hubDestination, router]);

  const isRedirecting =
    authStatus === "loading" || authStatus === "authenticated" || phase === "redirecting_member";

  if (isRedirecting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)] p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--ud-brand-primary)]" aria-hidden />
          <p className="mt-4 text-sm text-[var(--ud-text-secondary)]">Opening hub…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ud-bg-page)] pb-28 sm:pb-10">
      <header className="sticky top-0 z-30 border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="min-w-0 shrink">
            <UdeetsBrandLockup textClassName="text-lg" />
          </Link>
          <Link
            href={`/auth?redirect_to=${encodeURIComponent(returnUrl)}`}
            className="text-sm font-medium text-[var(--ud-brand-primary)] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <InviteTokenHandler showInvalidBanner={tokenInvalid} />

        <HubPreviewHero
          hubName={hub.name}
          tagline={hub.tagline}
          categoryLabel={categoryMeta.label}
          locationLabel={hub.locationLabel || undefined}
          visibilityLabel={hub.visibility}
          coverImageSrc={hub.heroImage || ""}
          dpImageSrc={hub.dpImage || ""}
          coverImageOffsetY={hub.coverImageOffsetY}
          dpImageOffsetY={hub.dpImageOffsetY}
          accentTheme={accentTheme}
        />

        <div className="mt-6">
          <JoinHubCTA
            hubName={hub.name}
            isPublicHub={isPublicHub}
            isAuthenticated={false}
            membership="guest"
            isJoining={false}
            joinError={null}
            joinSuccess={null}
            returnUrl={returnUrl}
            hubDestination={hubDestination}
            hubPageUrl={`/hubs/${category}/${slug}`}
            onJoin={() => {}}
            tokenInvalid={tokenInvalid}
          />
        </div>

        <div className="mt-8 space-y-8">
          <HubAboutPreview
            hubName={hub.name}
            description={hub.description}
            locationLabel={hub.locationLabel || undefined}
            website={hub.website}
            galleryImages={hub.galleryImages}
            accentTheme={accentTheme}
          />

          <div>
            <SectionHeading>Members</SectionHeading>
            <LockedMembersPreview returnUrl={returnUrl} />
          </div>
          <div>
            <SectionHeading>Posts</SectionHeading>
            <LockedPostsPreview returnUrl={returnUrl} />
          </div>
          <div>
            <SectionHeading>Photos</SectionHeading>
            <LockedPhotosPreview returnUrl={returnUrl} />
          </div>
          <div>
            <SectionHeading>Events</SectionHeading>
            <LockedEventsPreview returnUrl={returnUrl} />
          </div>
          <div>
            <SectionHeading>Chat</SectionHeading>
            <LockedChatPreview returnUrl={returnUrl} />
          </div>
        </div>
      </main>

      <MobileAppDownloadPrompt />
    </div>
  );
}

export function HubInviteLandingPage({
  hub,
  category,
  slug,
}: {
  hub: HubRecord;
  category: string;
  slug: string;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ud-brand-primary)]" />
        </main>
      }
    >
      <HubInviteLandingContent hub={hub} category={category} slug={slug} />
    </Suspense>
  );
}
