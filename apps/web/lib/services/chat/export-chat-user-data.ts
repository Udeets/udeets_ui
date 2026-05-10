import { createClient } from "@/lib/supabase/server";

export type ChatUserDataExport = {
  exportedAt: string;
  userId: string;
  messagesAuthored: unknown[];
  reactions: unknown[];
  pollVotes: unknown[];
  reportsFiled: unknown[];
  /** Attachment rows the user uploaded (no storage keys — metadata only). */
  attachmentsAuthored: unknown[];
};

export async function exportChatUserData(userId: string): Promise<ChatUserDataExport> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [messages, reactions, pollVotes, reports, attachmentsAuthored] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("id, room_id, message_kind, body, created_at, edited_at, deleted_at")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("chat_message_reactions").select("id, message_id, emoji, created_at").eq("user_id", userId).limit(5000),
    supabase.from("chat_poll_votes").select("id, poll_id, option_id, created_at").eq("user_id", userId).limit(5000),
    supabase
      .from("chat_message_reports")
      .select("id, room_id, hub_id, status, created_at, target_message_id, target_user_id, reason_code, reason")
      .eq("reporter_id", userId)
      .limit(1000),
    supabase
      .from("chat_message_attachments")
      .select("id, message_id, mime_type, original_filename, file_size_bytes, scan_status, created_at, deleted_at")
      .eq("uploaded_by", userId)
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  return {
    exportedAt: now,
    userId,
    messagesAuthored: messages.data ?? [],
    reactions: reactions.data ?? [],
    pollVotes: pollVotes.data ?? [],
    reportsFiled: reports.data ?? [],
    attachmentsAuthored: attachmentsAuthored.data ?? [],
  };
}
