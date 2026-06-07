export const FEED_INVALIDATE_EVENT = "udeets:feed-invalidate";
export const UNREAD_CHANGED_EVENT = "udeets:unread-changed";
export const MEMBER_PENDING_EVENT = "udeets:member-pending";
export const MEMBER_JOIN_ACCEPTED_EVENT = "udeets:member-join-accepted";
export const NOTIFICATION_EVENT = "udeets:notification";

export type MemberPendingDetail = {
  hubId: string;
  requesterUserId?: string;
};

export type UnreadChangedDetail = {
  hubId?: string;
};

export type NotificationEventDetail = {
  event_id: string;
  event_type: string;
  user_id: string;
  created_at: string;
  payload: Record<string, unknown>;
};

export function dispatchFeedInvalidate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(FEED_INVALIDATE_EVENT));
}

export function dispatchUnreadChanged(detail?: UnreadChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(UNREAD_CHANGED_EVENT, { detail: detail ?? {} }));
}

export function dispatchMemberPending(detail: MemberPendingDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MEMBER_PENDING_EVENT, { detail }));
}

export function dispatchMemberJoinAccepted(hubId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MEMBER_JOIN_ACCEPTED_EVENT, { detail: { hubId } }));
}

export function dispatchNotificationEnvelope(detail: NotificationEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail }));
}
