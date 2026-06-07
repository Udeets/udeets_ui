"use client";

import { useCallback } from "react";

import {
  dispatchFeedInvalidate,
  dispatchMemberJoinAccepted,
  dispatchMemberPending,
  dispatchNotificationEnvelope,
  dispatchUnreadChanged,
} from "@/lib/notifications/global-notification-events";
import type { NotificationEventEnvelope } from "@/lib/notifications/notifications-realtime-types";
import {
  isNotificationsRealtimeFeatureEnabled,
  useNotificationsRealtime,
} from "@/lib/notifications/use-notifications-realtime";

function hubIdFromPayload(payload: Record<string, unknown>): string | undefined {
  const hubId = payload.hubId;
  return typeof hubId === "string" && hubId ? hubId : undefined;
}

export function useGlobalNotifications(enabled: boolean) {
  const onEvent = useCallback((envelope: NotificationEventEnvelope) => {
    dispatchNotificationEnvelope(envelope);

    switch (envelope.event_type) {
      case "feed.invalidate":
        dispatchFeedInvalidate();
        return;
      case "unread.changed":
        dispatchUnreadChanged({ hubId: hubIdFromPayload(envelope.payload) });
        return;
      case "member.pending": {
        const hubId = hubIdFromPayload(envelope.payload);
        if (!hubId) return;
        const requesterUserId = envelope.payload.requesterUserId;
        dispatchMemberPending({
          hubId,
          requesterUserId:
            typeof requesterUserId === "string" ? requesterUserId : undefined,
        });
        dispatchFeedInvalidate();
        return;
      }
      case "member.join_accepted": {
        const hubId = hubIdFromPayload(envelope.payload);
        if (hubId) dispatchMemberJoinAccepted(hubId);
        dispatchFeedInvalidate();
        dispatchUnreadChanged({ hubId });
        return;
      }
      default:
        return;
    }
  }, []);

  useNotificationsRealtime({
    enabled: enabled && isNotificationsRealtimeFeatureEnabled(),
    onEvent,
  });
}
