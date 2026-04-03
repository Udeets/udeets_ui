"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader, type NavKey } from "@/components/udeets-navigation";
import { useAuthSession } from "@/services/auth/useAuthSession";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const PAGE_BG = "bg-[var(--ud-bg-page)]";
const TEXT_DARK = "text-[var(--ud-text-primary)]";

export function cardClass(extra?: string) {
  return cn("rounded-3xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm", extra);
}

export function sectionTitleClass(extra?: string) {
  return cn("text-xl font-semibold tracking-tight sm:text-2xl", TEXT_DARK, extra);
}

function MockAppShellContent({
  children,
  activeNav = "home",
}: {
  children: React.ReactNode;
  activeNav?: NavKey;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, status } = useAuthSession();
  const isDemoPreview = searchParams.get("demo_preview") === "1";

  useEffect(() => {
    if (status === "loading" || isAuthenticated || isDemoPreview) return;
    router.replace("/auth");
  }, [isAuthenticated, isDemoPreview, router, status]);

  if (status === "loading" && !isDemoPreview) {
    return (
      <div className={cn("min-h-screen", PAGE_BG)}>
        <UdeetsHeader />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
          <section className={cardClass("p-6 text-center")}>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--ud-text-primary)]">Loading...</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              We&apos;re checking your session.
            </p>
          </section>
        </main>
        <UdeetsFooter />
        <UdeetsBottomNav activeNav={activeNav} />
      </div>
    );
  }

  if (!isAuthenticated && !isDemoPreview) {
    return null;
  }

  return (
    <div className={cn("min-h-screen", PAGE_BG)}>
      <UdeetsHeader />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-6 lg:px-10">
        {children}
      </main>
      <UdeetsFooter />
      <UdeetsBottomNav activeNav={activeNav} />
    </div>
  );
}

export default function MockAppShell(props: {
  children: React.ReactNode;
  activeNav?: NavKey;
}) {
  return (
    <Suspense fallback={null}>
      <MockAppShellContent {...props} />
    </Suspense>
  );
}
