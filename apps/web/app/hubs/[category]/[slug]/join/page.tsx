"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/services/auth/useAuthSession";

type JoinStatus =
  | "checking"
  | "needs_signin"
  | "working"
  | "requested"
  | "joined"
  | "already_member"
  | "hub_not_found"
  | "error";

/**
 * Landing route for QR shares, Local feed clicks, and any other deep link
 * that might drop a user onto a hub they haven't joined yet.
 *
 * Behavior:
 *   1. Not signed in → render a "Sign in & continue" CTA that preserves the
 *      full URL (including any ?deet=) so we can return here after auth.
 *   2. Signed in →
 *      - Fetch hub visibility + any existing membership row
 *      - Already active member → bounce straight to the hub (or the deet if
 *        ?deet=<id> was supplied)
 *      - Already pending/invited → show the "pending" message
 *      - Public hub → insert an active membership row and forward to the deet
 *      - Private hub → insert a pending membership row and show the pending
 *        message (admin approves in their queue)
 *
 * The ?deet= query param makes this work for the Local feed: clicking a
 * platform-wide news/alert/deals/jobs card sends users through here so
 * membership gets handled automatically before they see the post.
 */
export default function HubJoinPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: authStatus, user } = useAuthSession();

  const deetId = searchParams.get("deet") || "";
  const hubDestination = deetId
    ? `/hubs/${category}/${slug}?tab=Posts&focus=${encodeURIComponent(deetId)}`
    : `/hubs/${category}/${slug}`;

  const [joinStatus, setJoinStatus] = useState<JoinStatus>("checking");
  const [hubName, setHubName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      setJoinStatus("needs_signin");
      return;
    }
    if (authStatus !== "authenticated" || !user?.id) {
      setJoinStatus("checking");
      return;
    }

    let cancelled = false;
    (async () => {
      setJoinStatus("working");
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const { data: hub, error: hubError } = await supabase
          .from("hubs")
          .select("id, name, visibility")
          .eq("category", category)
          .eq("slug", slug)
          .maybeSingle();
        if (cancelled) return;
        if (hubError || !hub) {
          setJoinStatus("hub_not_found");
          return;
        }
        setHubName(hub.name);

        const { data: existing } = await supabase
          .from("hub_members")
          .select("status")
          .eq("hub_id", hub.id)
          .eq("user_id", user.id)
          .maybeSingle();

        // Already in — jump straight to the hub / deet
        if (existing?.status === "active") {
          setJoinStatus("already_member");
          window.setTimeout(() => router.replace(hubDestination), 600);
          return;
        }

        // Already requested — don't create a duplicate pending row
        if (existing?.status === "pending" || existing?.status === "invited") {
          setJoinStatus("requested");
          return;
        }

        // New member — status depends on hub visibility
        const isPublic = hub.visibility === "public";
        const desiredStatus = isPublic ? "active" : "pending";

        const { error: insertError } = await supabase
          .from("hub_members")
          .insert({ hub_id: hub.id, user_id: user.id, role: "member", status: desiredStatus });
        if (insertError) {
          console.error("[join] hub_members insert failed:", insertError);
          setErrorMessage(insertError.message);
          setJoinStatus("error");
          return;
        }

        // Verify the row landed. RLS or other silent failures have caused
        // requests to "send" without ever being visible to the admin.
        const { data: verifyRow, error: verifyError } = await supabase
          .from("hub_members")
          .select("status")
          .eq("hub_id", hub.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (verifyError || !verifyRow) {
          console.error("[join] hub_members verify failed:", { verifyError, verifyRow });
          setErrorMessage("Request didn't save. Please try again.");
          setJoinStatus("error");
          return;
        }

        if (isPublic) {
          setJoinStatus("joined");
          window.setTimeout(() => router.replace(hubDestination), 700);
        } else {
          setJoinStatus("requested");
        }
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Could not complete that.");
        setJoinStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [authStatus, user?.id, category, slug, router, hubDestination]);

  const returnUrl = deetId
    ? `/hubs/${category}/${slug}/join?deet=${encodeURIComponent(deetId)}`
    : `/hubs/${category}/${slug}/join`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-8 text-center shadow-sm">
        {joinStatus === "checking" || joinStatus === "working" ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--ud-brand-primary)]" />
            <h1 className="mt-4 text-lg font-semibold text-[var(--ud-text-primary)]">
              {joinStatus === "working" ? "Opening hub…" : "Checking your sign-in…"}
            </h1>
          </>
        ) : joinStatus === "needs_signin" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Sign in to continue</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              You need a uDeets account to view this. It takes less than a minute.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/auth?redirect_to=${encodeURIComponent(returnUrl)}`}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Sign in &amp; continue
              </Link>
              <Link
                href={`/hubs/${category}/${slug}`}
                className="text-xs text-[var(--ud-text-muted)] underline-offset-2 hover:underline"
              >
                Preview the hub first
              </Link>
            </div>
          </>
        ) : joinStatus === "joined" || joinStatus === "already_member" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">
              {joinStatus === "joined" ? `Welcome to ${hubName}!` : "You're already in"}
            </h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              Taking you to <span className="font-medium text-[var(--ud-text-primary)]">{hubName}</span>…
            </p>
            <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-[var(--ud-brand-primary)]" />
          </>
        ) : joinStatus === "requested" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Request sent!</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              Your request to join <span className="font-medium text-[var(--ud-text-primary)]">{hubName}</span> is pending admin approval.
              {deetId ? " You'll be able to read the full post once the admin accepts." : " You'll be added once they accept."}
            </p>
            <Link
              href={`/hubs/${category}/${slug}`}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--ud-brand-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View hub
            </Link>
          </>
        ) : joinStatus === "hub_not_found" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Hub not found</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              This hub doesn&apos;t exist or is no longer available.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-[var(--ud-border)] px-5 py-2.5 text-sm font-medium text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
            >
              Discover other hubs
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">{errorMessage || "We couldn't open that. Please try again."}</p>
            <Link
              href={`/hubs/${category}/${slug}`}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-[var(--ud-border)] px-5 py-2.5 text-sm font-medium text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]"
            >
              Back to hub
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
