"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import type { HubContent } from "@/lib/hub-content";
import { listDeets, subscribeToDeets } from "@/lib/services/deets/list-deets";
import type { DeetRecord } from "@/lib/services/deets/deet-types";
import { mapDeetToHubFeedItem } from "../components/deets/map-deet-to-hub-feed-item";

export function useHubLiveFeed(hubId: string, hubCreatorId?: string) {
  const [livePublishedItems, setLivePublishedItems] = useState<HubContent["feed"]>([]);
  const [liveDraftItems, setLiveDraftItems] = useState<HubContent["feed"]>([]);

  useEffect(() => {
    let cancelled = false;

    const syncFeed = async () => {
      if (!hubId) {
        if (!cancelled) {
          setLivePublishedItems([]);
          setLiveDraftItems([]);
        }
        return;
      }

      try {
        const [published, drafts] = await Promise.all([
          listDeets({ hubIds: [hubId], publishedOnly: true }),
          listDeets({ hubIds: [hubId], draftsOnly: true }),
        ]);
        if (!cancelled) {
          startTransition(() => {
            setLivePublishedItems(published.map((item) => mapDeetToHubFeedItem(item, hubCreatorId)));
            setLiveDraftItems(drafts.map((item) => mapDeetToHubFeedItem(item, hubCreatorId)));
          });
        }
      } catch {
        if (!cancelled) {
          startTransition(() => {
            setLivePublishedItems([]);
            setLiveDraftItems([]);
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

  const prependCreatedDeet = useCallback(
    (createdDeet: DeetRecord) => {
      const mapped = mapDeetToHubFeedItem(createdDeet, hubCreatorId);
      const isDraft = createdDeet.is_published === false;
      startTransition(() => {
        if (isDraft) {
          setLiveDraftItems((current) => [mapped, ...current.filter((item) => item.id !== createdDeet.id)]);
        } else {
          setLivePublishedItems((current) => [mapped, ...current.filter((item) => item.id !== createdDeet.id)]);
        }
      });
    },
    [hubCreatorId],
  );

  const replaceDeet = useCallback(
    (updatedDeet: DeetRecord) => {
      const mapped = mapDeetToHubFeedItem(updatedDeet, hubCreatorId);
      const isDraft = updatedDeet.is_published === false;
      startTransition(() => {
        if (isDraft) {
          setLiveDraftItems((current) => {
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
          setLivePublishedItems((current) => current.filter((item) => item.id !== updatedDeet.id));
        } else {
          setLivePublishedItems((current) => {
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
          setLiveDraftItems((current) => current.filter((item) => item.id !== updatedDeet.id));
        }
      });
    },
    [hubCreatorId],
  );

  const removeDeet = useCallback((deetId: string) => {
    startTransition(() => {
      setLivePublishedItems((current) => current.filter((item) => item.id !== deetId));
      setLiveDraftItems((current) => current.filter((item) => item.id !== deetId));
    });
  }, []);

  const replaceFeedDeet = useCallback(
    (deet: DeetRecord) => {
      replaceDeet(deet);
    },
    [replaceDeet],
  );

  return {
    livePublishedItems,
    liveDraftItems,
    prependCreatedDeet,
    replaceDeet,
    removeDeet,
    replaceFeedDeet,
  };
}
