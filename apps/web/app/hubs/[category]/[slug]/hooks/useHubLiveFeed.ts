"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import type { HubContent } from "@/lib/hub-content";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import { mapDeetToHubFeedItem } from "../components/deets/map-deet-to-hub-feed-item";

export function useHubLiveFeed(hubId: string) {
  const [liveFeedItems, setLiveFeedItems] = useState<HubContent["feed"]>([]);

  useEffect(() => {
    let cancelled = false;

    const syncFeed = async () => {
      if (!hubId) {
        if (!cancelled) {
          setLiveFeedItems([]);
        }
        return;
      }

      try {
        const items = await listDeets({ hubIds: [hubId] });
        if (!cancelled) {
          startTransition(() => {
            setLiveFeedItems(items.map(mapDeetToHubFeedItem));
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setLiveFeedItems([]);
          });
        }
      }
    };

    void syncFeed();
    const unsubscribe = subscribeToDeets(() => {
      void syncFeed();
    }, { hubIds: [hubId] });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [hubId]);

  const prependCreatedDeet = useCallback((createdDeet: DeetRecord) => {
    startTransition(() => {
      setLiveFeedItems((current) => [
        mapDeetToHubFeedItem(createdDeet),
        ...current.filter((item) => item.id !== createdDeet.id),
      ]);
    });
  }, []);

  return {
    liveFeedItems,
    prependCreatedDeet,
  };
}
