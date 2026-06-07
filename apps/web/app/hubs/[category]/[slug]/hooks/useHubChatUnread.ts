"use client";

import { useCallback, useEffect, useState } from "react";

import { chatApiGetHubUnread } from "@/lib/chat/chat-browser-api";
import {
  NOTIFICATION_EVENT,
  type NotificationEventDetail,
} from "@/lib/notifications/global-notification-events";
import type { NotificationEventEnvelope } from "@/lib/notifications/notifications-realtime-types";

function hubIdFromEnvelope(envelope: NotificationEventEnvelope | NotificationEventDetail): string | null {
  const hubId = envelope.payload.hubId;
  return typeof hubId === "string" && hubId ? hubId : null;
}

function roomIdFromEnvelope(envelope: NotificationEventEnvelope | NotificationEventDetail): string | null {
  const roomId = envelope.payload.roomId;
  return typeof roomId === "string" && roomId ? roomId : null;
}

export function useHubChatUnread(hubId: string | undefined, enabled: boolean) {
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadRoomIds, setUnreadRoomIds] = useState<Set<string>>(() => new Set());

  const refreshUnread = useCallback(async () => {
    if (!hubId || !enabled) {
      setHasUnread(false);
      setUnreadRoomIds(new Set());
      return;
    }
    try {
      const res = await chatApiGetHubUnread(hubId);
      setHasUnread(res.hasUnread);
      setUnreadRoomIds(new Set(res.unreadRoomIds));
    } catch {
      /* best-effort */
    }
  }, [hubId, enabled]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  const onNotificationEvent = useCallback(
    (envelope: NotificationEventEnvelope | NotificationEventDetail) => {
      if (!hubId || !enabled) return;
      const eventHubId = hubIdFromEnvelope(envelope);
      if (eventHubId !== hubId) return;

      if (envelope.event_type === "chat.hub_unread") {
        setHasUnread(true);
        return;
      }
      if (envelope.event_type === "chat.hub_read") {
        setHasUnread(false);
        setUnreadRoomIds(new Set());
        return;
      }
      const roomId = roomIdFromEnvelope(envelope);
      if (!roomId) return;
      if (envelope.event_type === "chat.room_unread") {
        setHasUnread(true);
        setUnreadRoomIds((prev) => {
          const next = new Set(prev);
          next.add(roomId);
          return next;
        });
        return;
      }
      if (envelope.event_type === "chat.room_read") {
        setUnreadRoomIds((prev) => {
          const next = new Set(prev);
          next.delete(roomId);
          if (next.size === 0) {
            setHasUnread(false);
          }
          return next;
        });
      }
    },
    [hubId, enabled],
  );

  useEffect(() => {
    if (!enabled || !hubId) return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<NotificationEventDetail>).detail;
      if (!detail) return;
      onNotificationEvent(detail);
    };
    window.addEventListener(NOTIFICATION_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATION_EVENT, handler);
  }, [enabled, hubId, onNotificationEvent]);

  return { hasUnread, unreadRoomIds, refreshUnread };
}
