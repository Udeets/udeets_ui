import { listDeetsApi } from "@/lib/api/deets";
import { FEED_INVALIDATE_EVENT } from "@/lib/notifications/global-notification-events";
import { isNotificationsRealtimeFeatureEnabled } from "@/lib/notifications/use-notifications-realtime";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import {
  normalizeDeetRecord,
} from "@/lib/services/deets/query-utils";

export type ListDeetsOptions = {
  hubIds?: string[];
  /**
   * Restrict to specific `kind` values (e.g. ["News", "Jobs", "Alerts"]).
   * When set, the query uses an IN filter so we only pull what the caller
   * needs — used by the Local page to grab news/alerts/jobs/deals from
   * every hub on the platform without dragging every post along for the ride.
   */
  kinds?: string[];
  limit?: number;
  /**
   * When true, only `is_published` rows. Default true unless `draftsOnly` is set.
   * Set explicit `false` to include both published and drafts visible under RLS (rare).
   */
  publishedOnly?: boolean;
  /** Hub drafts for the current user only (RLS); implies `is_published = false`. */
  draftsOnly?: boolean;
};

export async function listDeets(options?: ListDeetsOptions): Promise<DeetRecord[]> {
  try {
    const rows = await listDeetsApi(options);
    return (rows ?? []).map((record) => normalizeDeetRecord(record));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to load deets: ${message}`);
  }
}

export function subscribeToDeets(
  onChange: () => void,
  options?: {
    hubIds?: string[];
  },
) {
  // Periodic refresh + focus/visibility nudges keep the feed fresh without browser DB access.
  void options;

  // Debounce rapid bursts (e.g. many likes at once) into a single refresh.
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      onChange();
    }, 150);
  };

  const onFeedInvalidate = () => schedule();
  if (typeof window !== "undefined") {
    window.addEventListener(FEED_INVALIDATE_EVENT, onFeedInvalidate);
  }

  let interval: ReturnType<typeof setInterval> | undefined;
  if (!isNotificationsRealtimeFeatureEnabled()) {
    interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      schedule();
    }, 8000);
  }

  const onVisible = () => {
    if (typeof document !== "undefined" && !document.hidden) {
      schedule();
    }
  };
  const onFocus = () => schedule();

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisible);
  }
  if (typeof window !== "undefined") {
    window.addEventListener("focus", onFocus);
  }

  return () => {
    if (interval) clearInterval(interval);
    if (typeof window !== "undefined") {
      window.removeEventListener(FEED_INVALIDATE_EVENT, onFeedInvalidate);
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisible);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", onFocus);
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}
