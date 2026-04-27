"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import type { HubContent } from "@/lib/hub-content";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import { mapDeetToHubFeedItem } from "../components/deets/map-deet-to-hub-feed-item";

export function useHubLiveFeed(hubId: string, hubCreatorId?: string) {
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
            setLiveFeedItems(items.map((item) => mapDeetToHubFeedItem(item, hubCreatorId)));
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
  }, [hubId, hubCreatorId]);

  const prependCreatedDeet = useCallback((createdDeet: DeetRecord) => {
    startTransition(() => {
      setLiveFeedItems((current) => [
        mapDeetToHubFeedItem(createdDeet, hubCreatorId),
        ...current.filter((item) => item.id !== createdDeet.id),
      ]);
    });
  }, [hubCreatorId]);

  const replaceDeet = useCallback((updatedDeet: DeetRecord) => {
    startTransition(() => {
      setLiveFeedItems((current) => {
        const mapped = mapDeetToHubFeedItem(updatedDeet, hubCreatorId);
        // Update in place if it already exists so the user's scroll position holds;
        // fall back to prepending so users always see their latest work.
        let replaced = false;
        const next = current.map((item) => {
          if (item.id === updatedDeet.id) {
            replaced = true;
            return mapped;
          }
          return item;
        });
        return replaced ? next : [mapped, ...next];
      });
    });
  }, [hubCreatorId]);

  const removeDeet = useCallback((deetId: string) => {
    startTransition(() => {
      setLiveFeedItems((current) => current.filter((item) => item.id !== deetId));
    });
  }, []);

  const replaceFeedDeet = useCallback(
    (deet: DeetRecord) => {
      startTransition(() => {
        setLiveFeedItems((current) =>
          current.map((item) => (item.id === deet.id ? mapDeetToHubFeedItem(deet, hubCreatorId) : item)),
        );
      });
    },
    [hubCreatorId],
  );

  return {
    liveFeedItems,
    prependCreatedDeet,
    replaceDeet,
    removeDeet,
    replaceFeedDeet,
  };
}
