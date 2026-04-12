"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import { AuthGuard } from "@/components/AuthGuard";

const LocalPageClient = dynamicImport(() => import("./components/LocalPageClient"), {
  ssr: false,
});

export default function LocalPage() {
  return (
    <AuthGuard>
      <LocalPageClient />
    </AuthGuard>
  );
}
