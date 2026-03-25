"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { UdeetsBottomNav, UdeetsFooter, UdeetsHeader, type NavKey } from "@/components/udeets-navigation";
import { useMockAuth } from "@/lib/mock-auth";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const PAGE_BG = "bg-[#E3F1EF]";
const TEXT_DARK = "text-[#111111]";

export function cardClass(extra?: string) {
  return cn("rounded-3xl border border-slate-100 bg-white shadow-sm", extra);
}

export function sectionTitleClass(extra?: string) {
  return cn("text-xl font-serif font-semibold tracking-tight sm:text-2xl", TEXT_DARK, extra);
}

export default function MockAppShell({
  children,
  activeNav = "home",
}: {
  children: React.ReactNode;
  activeNav?: NavKey;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loggedIn } = useMockAuth();
  const isDemoPreview = searchParams.get("demo_preview") === "1";

  useEffect(() => {
    if (loggedIn || isDemoPreview) return;
    router.replace("/");
  }, [isDemoPreview, loggedIn, router]);

  if (!loggedIn && !isDemoPreview) {
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
