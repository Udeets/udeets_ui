import { Suspense } from "react";
import DiscoverPageContent from "./DiscoverPageContent";

export default async function DiscoverPage() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let initialHubs: any[] = [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/hubs?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (res.ok) initialHubs = await res.json();
  } catch (e) {
    console.error("[discover] server fetch:", e);
  }

  return (
    <Suspense fallback={null}>
      <DiscoverPageContent initialHubs={initialHubs} />
    </Suspense>
  );
}
