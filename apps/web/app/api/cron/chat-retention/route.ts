import { NextResponse } from "next/server";

import { createServiceRoleSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const MAX_BATCHES = 40;

/**
 * Scheduled retention purge for chat messages. Configure in Vercel Cron (or similar)
 * to POST this URL daily with header `Authorization: Bearer <CRON_SECRET>`.
 *
 * Requires `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` in the server environment.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceRoleSupabase();
  if (!admin) {
    return NextResponse.json(
      { error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is not set." },
      { status: 503 },
    );
  }

  let total = 0;
  let batches = 0;
  while (batches < MAX_BATCHES) {
    const { data, error } = await admin.rpc("chat_purge_messages_past_retention", { p_limit: 500 });
    if (error) {
      console.error("[cron/chat-retention]", error);
      return NextResponse.json({ error: "Retention purge failed." }, { status: 500 });
    }
    const n = typeof data === "number" ? data : Number(data);
    if (!Number.isFinite(n) || n <= 0) break;
    total += n;
    batches += 1;
  }

  return NextResponse.json({ ok: true, deletedMessages: total, batches });
}
