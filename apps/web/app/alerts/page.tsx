"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import { useEffect, useState } from "react";

const AlertsPageClient = dynamicImport(() => import("./AlertsPageClient"), {
  ssr: false,
});

export default function AlertsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AlertsPageClient />;
}
