"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/services/auth/useAuthSession";

type JoinStatus =
  | "checking"
  | "needs_signin"
  | "requesting"
  | "requested"
  | "already_member"
  | "hub_not_found"
  | "error";

/**
 * Public landing page for the hub-join QR code.
 *
 * Flow:
 *   1. Visitor scans QR → lands here.
 *   2. If not signed in → show a "Sign in to request to join" prompt with
 *      a /auth link that returns here after login.
 *   3. If signed in → insert a pending row in hub_members (the admin still
 *      has to approve it in Members → Pending requests).
 *   4. Once inserted, auto-redirect to the hub page so the visitor sees it.
 */
export default function HubJoinPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = use(params);
  const router = useRouter();
  const { status: authStatus, user } = useAuthSession();

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
      setJoinStatus("requesting");
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Look up the hub by category + slug first so we have an ID to attach
        // the pending membership to.
        const { data: hub, error: hubError } = await supabase
          .from("hubs")
          .select("id, name")
          .eq("category", category)
          .eq("slug", slug)
          .maybeSingle();
        if (cancelled) return;
        if (hubError || !hub) {
          setJoinStatus("hub_not_found");
          return;
        }
        setHubName(hub.name);

        // If already an active member, skip straight to the hub.
        const { data: existing } = await supabase
          .from("hub_members")
          .select("status")
          .eq("hub_id", hub.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing?.status === "active") {
          setJoinStatus("already_member");
          window.setTimeout(() => router.replace(`/hubs/${category}/${slug}`), 900);
          return;
        }

        // Already requested? Just land them on the hub with a message.
        if (existing?.status === "pending" || existing?.status === "invited") {
          setJoinStatus("requested");
          return;
        }

        const { error: insertError } = await supabase
          .from("hub_members")
          .insert({ hub_id: hub.id, user_id: user.id, role: "member", status: "pending" });
        if (insertError) {
          setErrorMessage(insertError.message);
          setJoinStatus("error");
          return;
        }
        setJoinStatus("requested");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Could not send request.");
        setJoinStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [authStatus, user?.id, category, slug, router]);

  const returnUrl = `/hubs/${category}/${slug}/join`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ud-bg-page)] p-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-8 text-center shadow-sm">
        {joinStatus === "checking" || joinStatus === "requesting" ? (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--ud-brand-primary)]" />
            <h1 className="mt-4 text-lg font-semibold text-[var(--ud-text-primary)]">
              {joinStatus === "requesting" ? "Sending your request…" : "Checking your sign-in…"}
            </h1>
          </>
        ) : joinStatus === "needs_signin" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Sign in to join this hub</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              You need a uDeets account to request joining. It takes less than a minute.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={`/auth?redirect_to=${encodeURIComponent(returnUrl)}`}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Sign in & continue
              </Link>
              <Link
                href={`/hubs/${category}/${slug}`}
                className="text-xs text-[var(--ud-text-muted)] underline-offset-2 hover:underline"
              >
                Preview the hub first
              </Link>
            </div>
          </>
        ) : joinStatus === "requested" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Request sent!</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              Your request to join <span className="font-medium text-[var(--ud-text-primary)]">{hubName}</span> is pending admin approval. You&apos;ll be added once they accept.
            </p>
            <Link
              href={`/hubs/${category}/${slug}`}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--ud-brand-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              View hub
            </Link>
          </>
        ) : joinStatus === "already_member" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">You&apos;re already in</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              Taking you to <span className="font-medium text-[var(--ud-text-primary)]">{hubName}</span>…
            </p>
            <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-[var(--ud-brand-primary)]" />
          </>
        ) : joinStatus === "hub_not_found" ? (
          <>
            <h1 className="text-xl font-semibold text-[var(--ud-text-primary)]">Hub not found</h1>
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">
              This hub doesn&apos;t exist or is no longer available. Check with whoever shared the link.
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
            <p className="mt-2 text-sm text-[var(--ud-text-secondary)]">{errorMessage || "We couldn't send your request. Please try again."}</p>
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
