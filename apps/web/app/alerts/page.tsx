"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";

const AlertsPageClient = dynamicImport(() => import("./components/AlertsPageClient"), {
  ssr: false,
});

export default function AlertsPage() {
  return <AlertsPageClient />;
}
