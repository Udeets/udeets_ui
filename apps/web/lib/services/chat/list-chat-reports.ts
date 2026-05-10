import { createClient } from "@/lib/supabase/server";
import { assertChatVerb } from "@/lib/services/chat/assert-chat";
import { ChatNotFoundError } from "@/lib/services/chat/chat-errors";
import { resolveChatAuthContext } from "@/lib/services/chat/resolve-chat-context";

export type ChatReportListStatusFilter = "pending" | "resolved" | "dismissed" | "all";

export type ChatMessageReportRow = {
  id: string;
  hubId: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolverId: string | null;
  reporterId: string;
  targetMessageId: string | null;
  targetUserId: string | null;
  reason: string | null;
  reasonCode: string | null;
  details: string | null;
  appealStatus: string;
  appealSubmittedAt: string | null;
  /** Staff-only; never returned to reporters (list endpoint is mod-gated). */
  reviewNotesInternal: string | null;
  reporterDisplayName: string | null;
  targetUserDisplayName: string | null;
  resolverDisplayName: string | null;
};

export async function listChatMessageReports(
  userId: string,
  roomId: string,
  opts?: { status?: ChatReportListStatusFilter },
): Promise<ChatMessageReportRow[]> {
  const supabase = await createClient();
  const ctx = await resolveChatAuthContext(supabase, roomId, userId);
  if (!ctx) throw new ChatNotFoundError("Chat room not found.");
  assertChatVerb(ctx, "VIEW_REPORTS");

  const status = opts?.status ?? "all";

  let q = supabase
    .from("chat_message_reports")
    .select(
      "id, hub_id, room_id, status, created_at, resolved_at, resolver_id, reporter_id, target_message_id, target_user_id, reason, reason_code, details, appeal_status, appeal_submitted_at, review_notes_internal",
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[listChatMessageReports]", error);
    return [];
  }

  const rawRows = data ?? [];
  const nameIds = new Set<string>();
  for (const r of rawRows) {
    nameIds.add(r.reporter_id as string);
    if (r.target_user_id) nameIds.add(r.target_user_id as string);
    if (r.resolver_id) nameIds.add(r.resolver_id as string);
  }
  const nameById = new Map<string, string>();
  const ids = [...nameIds];
  if (ids.length) {
    const { data: profs, error: pErr } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    if (!pErr && profs) {
      for (const p of profs) {
        const id = p.id as string;
        const nm = (p.full_name as string | null)?.trim();
        if (nm) nameById.set(id, nm);
      }
    }
  }

  return rawRows.map((r) => {
    const reporterId = r.reporter_id as string;
    const targetUserId = (r.target_user_id as string | null) ?? null;
    const resolverId = (r.resolver_id as string | null) ?? null;
    return {
      id: r.id as string,
      hubId: r.hub_id as string,
      status: r.status as string,
      createdAt: r.created_at as string,
      resolvedAt: (r.resolved_at as string | null) ?? null,
      resolverId,
      reporterId,
      targetMessageId: (r.target_message_id as string | null) ?? null,
      targetUserId,
      reason: (r.reason as string | null) ?? null,
      reasonCode: (r.reason_code as string | null) ?? null,
      details: (r.details as string | null) ?? null,
      appealStatus: (r.appeal_status as string) ?? "none",
      appealSubmittedAt: (r.appeal_submitted_at as string | null) ?? null,
      reviewNotesInternal: (r.review_notes_internal as string | null) ?? null,
      reporterDisplayName: nameById.get(reporterId) ?? null,
      targetUserDisplayName: targetUserId ? (nameById.get(targetUserId) ?? null) : null,
      resolverDisplayName: resolverId ? (nameById.get(resolverId) ?? null) : null,
    };
  });
}
