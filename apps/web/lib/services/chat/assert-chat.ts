import { ChatForbiddenError } from "@/lib/services/chat/chat-errors";
import type { ChatAuthContext, ChatPermissionVerb, DeleteMessageSubject } from "@/lib/services/chat/chat-permissions";
import {
  evaluateChatPermission,
  evaluateCreateChatRoom,
  evaluateListChatRoomsInHub,
} from "@/lib/services/chat/chat-permissions";

export function assertCreateChatRoomAllowed(
  hubMembership: { role: "creator" | "admin" | "member"; status: string } | null,
): void {
  const r = evaluateCreateChatRoom(hubMembership);
  if (!r.ok) throw new ChatForbiddenError(r.reason);
}

export function assertListChatRoomsAllowed(
  hubMembership: { role: "creator" | "admin" | "member"; status: string } | null,
): void {
  const r = evaluateListChatRoomsInHub(hubMembership);
  if (!r.ok) throw new ChatForbiddenError(r.reason);
}

export function assertChatVerb(ctx: ChatAuthContext, verb: ChatPermissionVerb, extra?: DeleteMessageSubject): void {
  const r = evaluateChatPermission(ctx, verb, extra);
  if (!r.ok) throw new ChatForbiddenError(r.reason);
}
