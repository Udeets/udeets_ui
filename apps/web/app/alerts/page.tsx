"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/AuthGuard";

const AlertsPageClient = dynamicImport(() => import("./components/AlertsPageClient"), {
  ssr: false,
});

export default function AlertsPage() {
  return (
    <AuthGuard>
      <AlertsPageClient />
    </AuthGuard>
  );
}
