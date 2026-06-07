import type { ChatRoomDetail } from "@/lib/services/chat/get-chat-room";
import type { ChatPollDetailDto } from "@/lib/services/chat/get-chat-poll-by-message";
import type { ChatRoomListItem } from "@/lib/services/chat/list-chat-rooms";
import type { ChatRoomMemberDto } from "@/lib/services/chat/list-chat-room-members";
import type { ChatMessageListItem, ListChatMessagesResult } from "@/lib/services/chat/list-chat-messages";
import type { ChatMessageReportRow } from "@/lib/services/chat/list-chat-reports";
import type { ChatModerationActionRow } from "@/lib/services/chat/list-chat-moderation-actions";
import type { ChatInviteCandidateDto } from "@/lib/services/chat/list-chat-invite-candidates";
import { uuidSchema } from "@/lib/services/chat/chat-schemas";

export type {
  ChatMessageListItem,
  ChatRoomDetail,
  ChatRoomListItem,
  ChatPollDetailDto,
  ChatRoomMemberDto,
  ChatMessageReportRow,
  ChatModerationActionRow,
  ChatInviteCandidateDto,
};

export type ChatModerationActionBody =
  | { action: "hide_message"; messageId: string; reason?: string }
  | { action: "mute_user"; userId: string; mutedUntil?: string | null; reason?: string }
  | { action: "ban_user"; userId: string; reason?: string };

export type ChatPatchRoomBody = {
  name?: string;
  description?: string | null;
  archived?: boolean;
  /** null = indefinite; 30, 90, or 365 days for automated purge. */
  retentionDays?: number | null;
  settings?: {
    attachmentsEnabled?: boolean;
    invitePolicy?: "hub_admins_only" | "room_admins";
    whoCanCreatePolls?: "room_admin_and_moderator" | "room_admin_only" | "all_active_members";
  };
};

async function parseErr(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string; code?: string };
    if (j.code === "CHAT_RATE_LIMIT") return j.error ?? "Too many requests. Try again shortly.";
    return j.error ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await parseErr(res));
  return (await res.json()) as T;
}

/** Reject missing/placeholder hub ids before fetch (avoids `hubId=undefined` or JSON keys dropped by stringify). */
function requireChatHubId(hubId: unknown): string {
  const candidate = typeof hubId === "string" ? hubId.trim() : hubId;
  const parsed = uuidSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error("Chat hub is unavailable (invalid hub id).");
  }
  return parsed.data;
}

export async function chatApiListRooms(hubId: string): Promise<{ rooms: ChatRoomListItem[] }> {
  const id = requireChatHubId(hubId);
  const res = await fetch(`/api/v1/chat/rooms?hubId=${encodeURIComponent(id)}`, { credentials: "include" });
  return j(res);
}

export async function chatApiGetHubUnread(
  hubId: string,
): Promise<{ hubId: string; hasUnread: boolean; unreadRoomIds: string[] }> {
  const id = requireChatHubId(hubId);
  const res = await fetch(`/api/v1/chat/unread?hubId=${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  return j(res);
}

export async function chatApiMarkRoomRead(
  roomId: string,
  messageId?: string | null,
): Promise<{ hubId: string; hasUnread: boolean; unreadRoomIds: string[] }> {
  const parsed = uuidSchema.safeParse(roomId);
  if (!parsed.success) throw new Error("Invalid room id.");
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(parsed.data)}/read`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messageId ? { messageId } : {}),
  });
  return j(res);
}

export async function chatApiCreateRoom(body: { hubId: string; name: string; description?: string | null }): Promise<{ roomId: string }> {
  const hubId = requireChatHubId(body.hubId);
  const res = await fetch("/api/v1/chat/rooms", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hubId,
      name: body.name,
      description: body.description ?? null,
    }),
  });
  return j(res);
}

export async function chatApiGetRoom(roomId: string): Promise<{ room: ChatRoomDetail }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}`, { credentials: "include" });
  return j(res);
}

export async function chatApiRealtimePreflight(roomId: string): Promise<{ ok: boolean }> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/realtime-preflight`,
    { credentials: "include" },
  );
  return j(res);
}

export async function chatApiListMessages(roomId: string, opts?: { limit?: number; cursor?: string | null }): Promise<ListChatMessagesResult> {
  const sp = new URLSearchParams();
  if (opts?.limit != null) sp.set("limit", String(opts.limit));
  if (opts?.cursor) sp.set("cursor", opts.cursor);
  const q = sp.toString();
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages${q ? `?${q}` : ""}`, {
    credentials: "include",
  });
  return j(res);
}

export async function chatApiListMessagesSince(
  roomId: string,
  afterMessageId: string,
  opts?: { limit?: number },
): Promise<ListChatMessagesResult> {
  const sp = new URLSearchParams({ after: afterMessageId });
  if (opts?.limit != null) sp.set("limit", String(opts.limit));
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/since?${sp.toString()}`,
    { credentials: "include" },
  );
  return j(res);
}

export async function chatApiSendMessage(
  roomId: string,
  body: { body: string; messageKind: "text" | "media" | "attachment" | "poll"; replyToId?: string | null },
): Promise<{ messageId: string }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return j(res);
}

export async function chatApiPatchMessage(roomId: string, messageId: string, body: { body: string }): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiDeleteMessage(roomId: string, messageId: string, moderationReason?: string): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(moderationReason ? { moderationReason } : {}),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiPatchRoom(roomId: string, body: ChatPatchRoomBody): Promise<{ room: ChatRoomDetail }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return j(res);
}

export async function chatApiDeleteRoom(roomId: string): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiRespondChatInvite(roomId: string, action: "accept" | "decline"): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/invites/respond`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiListReports(
  roomId: string,
  opts?: { status?: "pending" | "resolved" | "dismissed" | "all" },
): Promise<{ reports: ChatMessageReportRow[] }> {
  const sp = new URLSearchParams();
  if (opts?.status) sp.set("status", opts.status);
  const q = sp.toString();
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/reports${q ? `?${q}` : ""}`, {
    credentials: "include",
  });
  return j(res);
}

export async function chatApiPatchReport(
  roomId: string,
  reportId: string,
  body: { status: "resolved" | "dismissed"; staffNotes?: string },
): Promise<void> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/reports/${encodeURIComponent(reportId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiModeration(roomId: string, body: ChatModerationActionBody): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/moderation`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiListModerationActions(
  roomId: string,
): Promise<{ actions: ChatModerationActionRow[] }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/moderation-actions`, {
    credentials: "include",
  });
  return j(res);
}

export async function chatApiTyping(roomId: string, phase: "started" | "stopped"): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/typing`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phase }),
  });
  if (res.status === 204) return;
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiAddReaction(roomId: string, messageId: string, emoji: string): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/reactions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emoji }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiRemoveReaction(roomId: string, messageId: string, emoji: string): Promise<void> {
  const q = new URLSearchParams({ emoji });
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/reactions?${q}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiCreateReport(
  roomId: string,
  body: { targetMessageId?: string; targetUserId?: string; reason: string; reasonCode?: string; details?: string },
): Promise<{ reportId: string }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/reports`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return j(res);
}

export async function chatApiListMembers(roomId: string): Promise<{ members: ChatRoomMemberDto[] }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/members`, { credentials: "include" });
  return j(res);
}

export async function chatApiInviteCandidates(roomId: string): Promise<{ candidates: ChatInviteCandidateDto[] }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/invite-candidates`, { credentials: "include" });
  return j(res);
}

export async function chatApiAddMember(roomId: string, userId: string, role?: "member" | "moderator" | "admin"): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/members`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role: role ?? "member" }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiRemoveMember(roomId: string, memberUserId: string): Promise<void> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(memberUserId)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function chatApiInviteMember(roomId: string, invitedUserId: string): Promise<unknown> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/invites`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invitedUserId }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  return res.json().catch(() => ({}));
}

export { chatApiRevokeInvite } from "./chat-api-invite-revoke";

export async function chatApiGetPollByMessage(roomId: string, messageId: string): Promise<{ poll: ChatPollDetailDto }> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/poll`,
    { credentials: "include" },
  );
  return j(res);
}

export async function chatApiGetPoll(roomId: string, pollId: string): Promise<{ poll: ChatPollDetailDto }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/polls/${encodeURIComponent(pollId)}`, {
    credentials: "include",
  });
  return j(res);
}

export async function chatApiCreatePoll(
  roomId: string,
  body: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    anonymousVoting?: boolean;
    closesAt?: string | null;
    messageBody?: string;
  },
): Promise<{ messageId: string; pollId: string }> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/polls`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return j(res);
}

export async function chatApiVotePoll(roomId: string, pollId: string, optionId: string): Promise<void> {
  const res = await fetch(`/api/v1/chat/rooms/${encodeURIComponent(roomId)}/polls/${encodeURIComponent(pollId)}/vote`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ optionId }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
}

export type PrepareUploadResult = {
  bucket: string;
  storageKey: string;
  signedUploadUrl: string;
  token: string;
  maxBytesForMime?: number;
};

export async function chatApiPrepareUpload(
  roomId: string,
  messageId: string,
  body: { fileName: string; mimeType: string; sizeBytes: number },
): Promise<PrepareUploadResult> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/attachments/prepare`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return j(res);
}

export async function chatApiSignedAttachmentUrl(
  roomId: string,
  attachmentId: string,
): Promise<{ url: string; expiresIn: number }> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/attachments/${encodeURIComponent(attachmentId)}/download`,
    { credentials: "include" },
  );
  return j(res);
}

export async function chatApiCompleteUpload(
  roomId: string,
  messageId: string,
  body: { storageKey: string; mimeType: string; originalFilename: string; sizeBytes: number },
): Promise<unknown> {
  const res = await fetch(
    `/api/v1/chat/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/attachments/complete`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(await parseErr(res));
  return res.json();
}

export async function chatApiExportMyData(): Promise<{
  exportedAt: string;
  userId: string;
  messagesAuthored: unknown[];
  reactions: unknown[];
  pollVotes: unknown[];
  reportsFiled: unknown[];
  attachmentsAuthored: unknown[];
}> {
  const res = await fetch("/api/v1/chat/me/export", { credentials: "include" });
  return j(res);
}

export async function chatApiAnonymizeMe(): Promise<{ ok: boolean }> {
  const res = await fetch("/api/v1/chat/me/anonymize", {
    method: "POST",
    credentials: "include",
  });
  return j(res);
}

/** PUT file bytes to signed URL; progress 0–1 */
export function chatUploadToSignedUrl(
  signedUrl: string,
  file: Blob,
  mimeType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && onProgress) onProgress(ev.loaded / ev.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
}
