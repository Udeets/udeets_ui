"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { subscribeChatRoomRealtime } from "@/lib/chat/subscribe-chat-room-realtime";
import { chatApiGetRoom, chatApiListMessages, chatApiSendMessage } from "@/lib/chat/chat-browser-api";
import { friendlyChatUserMessage } from "@/lib/chat/friendly-chat-error";
import type { ChatMessageViewModel } from "@/lib/chat/chat-message-view";
import { applyTypingRealtimeEvent, pruneTypingMap, type TypingMap } from "@/lib/chat/merge-chat-typing";
import type { ChatRealtimeServerEvent } from "@/lib/services/chat/chat-realtime-contract";
import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";
import { sameChatReactionEmoji } from "@/lib/services/chat/chat-reaction-emoji";
import type { ChatRoomDetail } from "@/lib/services/chat/get-chat-room";

export type HubChatThreadOptions = {
  /** Fired for every realtime event (before message map is applied). */
  onRealtimeEvent?: (ev: ChatRealtimeServerEvent) => void;
};

const TYPING_PRUNE_MS = 8000;

function toListItemFromRow(
  row: Record<string, unknown> | undefined | null,
  viewerCanModerate: boolean,
  viewerUserId: string | null | undefined,
): ChatMessageViewModel | null {
  if (!row || typeof row.id !== "string") return null;
  const deletedAt = row.deleted_at != null ? String(row.deleted_at) : null;
  const deleted = !!deletedAt;
  const senderIdRaw = row.sender_id != null ? String(row.sender_id) : null;
  const isOwn = Boolean(viewerUserId && senderIdRaw === viewerUserId);
  const redacted = deleted && (!viewerCanModerate || isOwn);
  const modReason = row.moderation_reason != null ? String(row.moderation_reason) : null;
  return {
    id: String(row.id),
    roomId: String(row.room_id ?? ""),
    messageKind: String(row.message_kind ?? "text"),
    createdAt: String(row.created_at ?? ""),
    editedAt: row.edited_at != null ? String(row.edited_at) : null,
    deletedAt,
    senderId: senderIdRaw,
    senderDisplayName: row.sender_display_name_snapshot != null ? String(row.sender_display_name_snapshot) : null,
    senderAvatarUrl: row.sender_avatar_url_snapshot != null ? String(row.sender_avatar_url_snapshot) : null,
    body: redacted ? CHAT_DELETED_MESSAGE_PLACEHOLDER : row.body != null ? String(row.body) : "",
    attachments: redacted ? [] : [],
    reactions: redacted ? [] : [],
    redacted,
    moderationReason: viewerCanModerate && deleted && !isOwn ? modReason : null,
  };
}

function stripClientSendFields(m: ChatMessageViewModel): ChatMessageViewModel {
  const { clientSendState: _s, clientSendError: _e, clientLocalId: _l, ...rest } = m;
  return rest;
}

function applyServerEvent(
  prev: ChatMessageViewModel[],
  ev: ChatRealtimeServerEvent,
  viewerCanModerate: boolean,
  viewerUserId: string | null | undefined,
): ChatMessageViewModel[] {
  switch (ev.name) {
    case "message.created": {
      const item = toListItemFromRow(ev.payload.message as Record<string, unknown>, viewerCanModerate, viewerUserId);
      if (!item) return prev;
      if (prev.some((m) => m.id === item.id)) return prev;
      return [item, ...prev];
    }
    case "message.edited":
    case "message.deleted": {
      const row = ev.payload.message as Record<string, unknown>;
      const id = String(row.id ?? "");
      const next = toListItemFromRow(row, viewerCanModerate, viewerUserId);
      if (!next) return prev;
      return prev.map((m) => {
        if (m.id !== id) return m;
        const merged = { ...next, reactions: m.reactions, attachments: m.attachments };
        return stripClientSendFields(merged);
      });
    }
    case "moderation.message_hidden": {
      const { messageId, moderationReason } = ev.payload;
      const now = new Date().toISOString();
      return prev.map((m) => {
        if (m.id !== messageId) return m;
        if (viewerCanModerate) {
          return stripClientSendFields({
            ...m,
            deletedAt: m.deletedAt ?? now,
            moderationReason: moderationReason ?? m.moderationReason ?? null,
            redacted: false,
          });
        }
        return stripClientSendFields({
          ...m,
          redacted: true,
          deletedAt: m.deletedAt ?? now,
          senderId: null,
          senderDisplayName: null,
          senderAvatarUrl: null,
          body: CHAT_DELETED_MESSAGE_PLACEHOLDER,
          attachments: [],
          reactions: [],
          moderationReason: null,
        });
      });
    }
    case "reaction.updated": {
      const { messageId, kind, reaction, reactionId } = ev.payload;
      return prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = [...m.reactions];
        if (kind === "added" && reaction) {
          const r = reaction as Record<string, unknown>;
          const id = String(r.id ?? "");
          const userId = String(r.user_id ?? "");
          const emoji = String(r.emoji ?? "");
          const createdAt = String(r.created_at ?? "");
          const dup = reactions.some((x) => x.id === id || (x.userId === userId && sameChatReactionEmoji(x.emoji, emoji)));
          if (!dup) {
            reactions.push({ id, userId, emoji, createdAt });
          }
        } else if (kind === "removed") {
          let idx = reactionId ? reactions.findIndex((x) => x.id === reactionId) : -1;
          if (idx < 0 && reaction) {
            const r = reaction as Record<string, unknown>;
            const uid = typeof r.user_id === "string" ? r.user_id : undefined;
            const em = typeof r.emoji === "string" ? r.emoji : undefined;
            if (uid && em) {
              idx = reactions.findIndex((x) => x.userId === uid && sameChatReactionEmoji(x.emoji, em));
            }
          }
          if (idx >= 0) reactions.splice(idx, 1);
        }
        return { ...m, reactions };
      });
    }
    case "report.created":
      return prev;
    default:
      return prev;
  }
}

export function useHubChatThread(
  roomId: string | null,
  viewerUserId?: string | null,
  viewerDisplayName?: string | null,
  options?: HubChatThreadOptions,
) {
  const onRealtimeEventRef = useRef(options?.onRealtimeEvent);
  onRealtimeEventRef.current = options?.onRealtimeEvent;

  const [room, setRoom] = useState<ChatRoomDetail | null>(null);
  const viewerCanModerateRef = useRef(false);
  const viewerUserIdRef = useRef<string | null | undefined>(viewerUserId);
  const [messages, setMessages] = useState<ChatMessageViewModel[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [pollTick, setPollTick] = useState(0);
  const [typingMap, setTypingMap] = useState<TypingMap>({});

  const displayName = viewerDisplayName?.trim() || "You";

  const loadRoom = useCallback(async (): Promise<ChatRoomDetail | null> => {
    if (!roomId) return null;
    try {
      const { room: r } = await chatApiGetRoom(roomId);
      setRoom(r);
      setError(null);
      return r;
    } catch (e) {
      setError(friendlyChatUserMessage(e, "Could not load this room. Please try again."));
      setRoom(null);
      return null;
    }
  }, [roomId]);

  const loadInitialMessages = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await chatApiListMessages(roomId, { limit: 40 });
      setMessages(res.messages as ChatMessageViewModel[]);
      setNextCursor(res.nextCursor);
    } catch (e) {
      setError(friendlyChatUserMessage(e, "Could not load messages. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (!roomId || nextCursor == null) return;
    setLoadingMore(true);
    try {
      const res = await chatApiListMessages(roomId, { limit: 40, cursor: nextCursor });
      setMessages((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const more = (res.messages as ChatMessageViewModel[]).filter((m) => !existing.has(m.id));
        return [...prev, ...more];
      });
      setNextCursor(res.nextCursor);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, nextCursor]);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setMessages([]);
      setNextCursor(null);
      setError(null);
      setTypingMap({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const r = await loadRoom();
      if (cancelled) return;
      if (!r) return;
      if (r.viewerPendingInvite) {
        setMessages([]);
        setNextCursor(null);
        setLoading(false);
        return;
      }
      await loadInitialMessages();
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, loadRoom, loadInitialMessages]);

  useEffect(() => {
    viewerCanModerateRef.current = room?.viewerCanModerate ?? false;
  }, [room?.viewerCanModerate]);

  useEffect(() => {
    viewerUserIdRef.current = viewerUserId;
  }, [viewerUserId]);

  useEffect(() => {
    if (!roomId) return;
    const t = setInterval(() => {
      setTypingMap((m) => pruneTypingMap(m, Date.now(), TYPING_PRUNE_MS));
    }, 2000);
    return () => clearInterval(t);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !room || room.id !== roomId || room.viewerPendingInvite) {
      return () => {};
    }
    let unsub: (() => Promise<void>) | null = null;
    (async () => {
      try {
        unsub = await subscribeChatRoomRealtime(roomId, {
          onServerEvent: (ev) => {
            onRealtimeEventRef.current?.(ev);
            if (ev.name === "poll.updated") setPollTick((x) => x + 1);
            if (ev.name === "typing.started" || ev.name === "typing.stopped") {
              setTypingMap((prev) => applyTypingRealtimeEvent(prev, ev, viewerUserId ?? undefined));
              return;
            }
            setMessages((prev) =>
              applyServerEvent(prev, ev, viewerCanModerateRef.current, viewerUserIdRef.current),
            );
          },
        });
      } catch {
        /* Realtime optional */
      }
    })();
    return () => {
      void unsub?.();
    };
  }, [roomId, room, viewerUserId]);

  const typingUserIds = Object.keys(typingMap).filter((id) => id !== (viewerUserId ?? ""));

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!roomId || !trimmed) return;
    if (!viewerUserId) {
      setError("Sign in to send messages.");
      return;
    }
    const localId = `local-${crypto.randomUUID()}`;
    const optimistic: ChatMessageViewModel = {
      id: localId,
      roomId,
      messageKind: "text",
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      senderId: viewerUserId,
      senderDisplayName: displayName,
      senderAvatarUrl: null,
      body: trimmed,
      attachments: [],
      reactions: [],
      redacted: false,
      moderationReason: null,
      clientSendState: "pending",
      clientLocalId: localId,
    };
    setMessages((prev) => [optimistic, ...prev]);
    setError(null);
    try {
      const { messageId } = await chatApiSendMessage(roomId, { body: trimmed, messageKind: "text", replyToId: null });
      setMessages((prev) => {
        const withoutOpt = prev.filter((m) => m.clientLocalId !== localId);
        if (withoutOpt.some((m) => m.id === messageId)) return withoutOpt;
        const opt = prev.find((m) => m.clientLocalId === localId);
        if (!opt) return prev;
        const merged: ChatMessageViewModel = {
          ...opt,
          id: messageId,
          clientSendState: undefined,
          clientSendError: undefined,
          clientLocalId: undefined,
        };
        return [merged, ...withoutOpt];
      });
    } catch (e) {
      const safe = friendlyChatUserMessage(e, "Could not send. Please try again.");
      setMessages((prev) =>
        prev.map((m) => (m.clientLocalId === localId ? { ...m, clientSendState: "failed" as const, clientSendError: safe } : m)),
      );
      setError(safe);
    }
  };

  const retrySend = useCallback(
    async (localId: string) => {
      if (!roomId || !viewerUserId) return;
      let bodyToSend = "";
      setMessages((prev) => {
        const row = prev.find((m) => m.clientLocalId === localId && m.clientSendState === "failed");
        bodyToSend = row?.body?.trim() ?? "";
        if (!bodyToSend) return prev;
        return prev.map((m) =>
          m.clientLocalId === localId ? { ...m, clientSendState: "pending" as const, clientSendError: undefined } : m,
        );
      });
      if (!bodyToSend) return;
      setError(null);
      try {
        const { messageId } = await chatApiSendMessage(roomId, { body: bodyToSend, messageKind: "text", replyToId: null });
        setMessages((prev) => {
          const withoutOpt = prev.filter((m) => m.clientLocalId !== localId);
          if (withoutOpt.some((m) => m.id === messageId)) return withoutOpt;
          const opt = prev.find((m) => m.clientLocalId === localId);
          if (!opt) return prev;
          return [
            {
              ...opt,
              id: messageId,
              clientSendState: undefined,
              clientSendError: undefined,
              clientLocalId: undefined,
            },
            ...withoutOpt,
          ];
        });
      } catch (e) {
        const safe = friendlyChatUserMessage(e, "Could not send. Please try again.");
        setMessages((prev) =>
          prev.map((m) => (m.clientLocalId === localId ? { ...m, clientSendState: "failed", clientSendError: safe } : m)),
        );
        setError(safe);
      }
    },
    [roomId, viewerUserId],
  );

  /** Legacy attachment/poll flows still toggle this while awaiting reload. */
  const setSendingBusy = useCallback((v: boolean) => {
    setSending(v);
  }, []);

  const discardOutbound = useCallback((localId: string) => {
    setMessages((prev) => prev.filter((m) => m.clientLocalId !== localId));
    setError(null);
  }, []);

  /** After a successful DELETE, update UI immediately (Realtime may lag or be unavailable). */
  const removeReactionLocally = useCallback(
    (messageId: string, reactionId: string, fallback?: { userId: string; emoji: string }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          if (reactionId) {
            const filtered = m.reactions.filter((r) => r.id !== reactionId);
            if (filtered.length !== m.reactions.length) return { ...m, reactions: filtered };
          }
          if (fallback) {
            return {
              ...m,
              reactions: m.reactions.filter(
                (r) => !(r.userId === fallback.userId && sameChatReactionEmoji(r.emoji, fallback.emoji)),
              ),
            };
          }
          return m;
        }),
      );
    },
    [],
  );

  const softDeleteMessageLocally = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const canMod = viewerCanModerateRef.current;
        const uid = viewerUserIdRef.current;
        const isOwn = Boolean(uid && m.senderId === uid);
        const now = new Date().toISOString();
        const redacted = !canMod || isOwn;
        if (redacted) {
          return stripClientSendFields({
            ...m,
            deletedAt: now,
            redacted: true,
            body: CHAT_DELETED_MESSAGE_PLACEHOLDER,
            attachments: [],
            reactions: [],
            moderationReason: null,
          });
        }
        return stripClientSendFields({
          ...m,
          deletedAt: now,
          redacted: false,
          moderationReason: null,
        });
      }),
    );
  }, []);

  return {
    room,
    messages,
    nextCursor,
    loading,
    loadingMore,
    error,
    sending,
    loadMore,
    sendText,
    retrySend,
    setError,
    pollTick,
    reloadRoom: loadRoom,
    reloadMessages: loadInitialMessages,
    typingUserIds,
    setSendingBusy,
    discardOutbound,
    removeReactionLocally,
    softDeleteMessageLocally,
  };
}
