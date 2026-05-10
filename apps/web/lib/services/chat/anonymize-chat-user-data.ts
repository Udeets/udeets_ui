import { createClient } from "@/lib/supabase/server";
import { createServiceRoleSupabase } from "@/lib/supabase/admin";

/**
 * GDPR-style cleanup for chat tables when a user account is removed or requests erasure.
 * Call from a secured route after verifying the subject is the signed-in user (or admin job).
 *
 * When `SUPABASE_SERVICE_ROLE_KEY` is set, uses `chat_erasure_apply_for_user` (RLS-safe batch).
 * Otherwise falls back to the authenticated user's client (may be less complete if RLS blocks).
 */
export async function anonymizeChatUserData(userId: string): Promise<void> {
  const admin = createServiceRoleSupabase();
  if (admin) {
    const { error } = await admin.rpc("chat_erasure_apply_for_user", { p_user_id: userId });
    if (error) {
      console.error("[anonymizeChatUserData] rpc", error);
      throw new Error("Could not complete chat data erasure.");
    }
    return;
  }

  const supabase = await createClient();

  await supabase
    .from("chat_messages")
    .update({
      sender_id: null,
      body: "[Content removed]",
      sender_display_name_snapshot: "Deleted User",
      sender_avatar_url_snapshot: null,
    })
    .eq("sender_id", userId);

  await supabase.from("chat_message_reactions").delete().eq("user_id", userId);
  await supabase.from("chat_poll_votes").delete().eq("user_id", userId);

  await supabase
    .from("chat_message_reports")
    .update({
      reason: null,
      details: null,
      reason_code: "erasure",
      review_notes_internal: null,
      appeal_body: null,
    })
    .eq("reporter_id", userId);

  await supabase.from("chat_room_mutes").delete().eq("user_id", userId);
  await supabase.from("chat_room_bans").delete().eq("user_id", userId);

  const now = new Date().toISOString();
  await supabase
    .from("chat_message_attachments")
    .update({ deleted_at: now, original_filename: null, scan_status: "skipped" })
    .eq("uploaded_by", userId)
    .is("deleted_at", null);
}
