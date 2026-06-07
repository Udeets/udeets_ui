"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  chatApiGetRoom,
  chatApiListMessages,
  chatApiListMessagesSince,
  chatApiSendMessage,
} from "@/lib/chat/chat-browser-api";
import type { ChatEventEnvelope } from "@/lib/chat/chat-realtime-types";
import { friendlyChatUserMessage } from "@/lib/chat/friendly-chat-error";
import { stripClientSendFields, type ChatMessageViewModel } from "@/lib/chat/chat-message-view";
import { applyMessageEnvelope, applyReactionEnvelope } from "@/lib/chat/merge-chat-events";
import { pruneTypingMap, type TypingMap } from "@/lib/chat/merge-chat-typing";
import {
  isChatPollingFallbackEnabled,
  isChatRealtimeFeatureEnabled,
  useChatRealtime,
} from "@/lib/chat/use-chat-realtime";
import { CHAT_DELETED_MESSAGE_PLACEHOLDER } from "@/lib/services/chat/chat-message-constants";
import { sameChatReactionEmoji } from "@/lib/services/chat/chat-reaction-emoji";
import type { ChatRoomDetail } from "@/lib/services/chat/get-chat-room";

const TYPING_PRUNE_MS = 8000;

/** Poll interval when WebSocket realtime is off or disconnected (fallback). */
const MESSAGE_SYNC_POLL_MS = 4000;

/**
 * Hub chat thread: REST for writes/history; WebSocket push when realtime flags are enabled.
 */
export function useHubChatThread(
  roomId: string | null,
  viewerUserId?: string | null,
  viewerDisplayName?: string | null,
) {
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
  const [localTypingMap, setLocalTypingMap] = useState<TypingMap>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [membersTick, setMembersTick] = useState(0);

  const realtimeEnabled =
    isChatRealtimeFeatureEnabled() && Boolean(roomId) && Boolean(room?.id === roomId && !room?.viewerPendingInvite);
  const usePollingFallback =
    isChatPollingFallbackEnabled() && (!isChatRealtimeFeatureEnabled() || !wsConnected);

  const lastSeenMessageId = messages.find((m) => !m.clientSendState && !m.id.startsWith("local-"))?.id ?? null;

  const onRealtimeEvent = useCallback((envelope: ChatEventEnvelope) => {
    if (envelope.event_type === "poll.updated") {
      setPollTick((x) => x + 1);
      return;
    }
    if (envelope.event_type === "reaction.updated") {
      setMessages((prev) => applyReactionEnvelope(prev, envelope));
      return;
    }
    if (
      envelope.event_type === "room.member_joined" ||
      envelope.event_type === "room.member_removed"
    ) {
      setMembersTick((x) => x + 1);
      return;
    }
    if (
      envelope.event_type.startsWith("message.") ||
      envelope.event_type === "moderation.message_hidden"
    ) {
      setMessages((prev) => applyMessageEnvelope(prev, envelope));
    }
  }, []);

  const { typingMap: realtimeTypingMap } = useChatRealtime({
    roomId: realtimeEnabled ? roomId : null,
    enabled: realtimeEnabled,
    lastSeenMessageId,
    onEvent: onRealtimeEvent,
    onConnectionChange: setWsConnected,
    onAccessRevoked: () => {
      setError("You no longer have access to this chat room.");
    },
  });

  useEffect(() => {
    if (!realtimeEnabled || !wsConnected || !roomId || !lastSeenMessageId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await chatApiListMessagesSince(roomId, lastSeenMessageId, { limit: 50 });
        if (cancelled || res.messages.length === 0) return;
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const incoming = (res.messages as ChatMessageViewModel[]).filter((m) => !ids.has(m.id));
          if (incoming.length === 0) return prev;
          return [...incoming.reverse(), ...prev];
        });
      } catch {
        /* backfill is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [realtimeEnabled, wsConnected, roomId, lastSeenMessageId]);

  const typingMap = isChatRealtimeFeatureEnabled() ? realtimeTypingMap : localTypingMap;

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
      setLocalTypingMap({});
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
    if (!roomId || isChatRealtimeFeatureEnabled()) return;
    const t = setInterval(() => {
      setLocalTypingMap((m) => pruneTypingMap(m, Date.now(), TYPING_PRUNE_MS));
    }, 2000);
    return () => clearInterval(t);
  }, [roomId]);

  useEffect(() => {
    if (!usePollingFallback || !roomId || !room || room.id !== roomId || room.viewerPendingInvite) {
      return () => {};
    }
    let cancelled = false;
    const syncMessages = async () => {
      try {
        const res = await chatApiListMessages(roomId, { limit: 40 });
        if (cancelled) return;
        setPollTick((x) => x + 1);
        setMessages((prev) => {
          const serverMessages = res.messages as ChatMessageViewModel[];
          const serverIds = new Set(serverMessages.map((m) => m.id));
          const pendingClientMessages = prev.filter(
            (m) => m.clientSendState === "pending" && !serverIds.has(m.id),
          );
          return [...pendingClientMessages, ...serverMessages];
        });
      } catch {
        /* polling is best-effort */
      }
    };
    void syncMessages();
    const timer = window.setInterval(() => {
      void syncMessages();
    }, MESSAGE_SYNC_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [roomId, room, usePollingFallback]);

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
    membersTick,
    wsConnected,
    lastSeenMessageId,
    reloadRoom: loadRoom,
    reloadMessages: loadInitialMessages,
    typingUserIds,
    setSendingBusy,
    discardOutbound,
    removeReactionLocally,
    softDeleteMessageLocally,
  };
}
