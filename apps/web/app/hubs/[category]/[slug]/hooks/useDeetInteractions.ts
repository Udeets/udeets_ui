"use client";

import { useCallback, useEffect, useState } from "react";
import { toggleDeetLike, getDeetLikeStatus } from "@/lib/services/deets/deet-interactions";
import type { HubContent } from "@/lib/hub-content";

export function useDeetInteractions(feedItems: HubContent["feed"]) {
  const [likedDeetIds, setLikedDeetIds] = useState<Set<string>>(new Set());
  const [likingDeetIds, setLikingDeetIds] = useState<Set<string>>(new Set());

  // Fetch like status when feed items change
  useEffect(() => {
    const deetIds = feedItems.map((item) => item.id).filter(Boolean);
    if (!deetIds.length) return;

    let cancelled = false;

    async function fetchLikeStatus() {
      try {
        const statusMap = await getDeetLikeStatus(deetIds);
        if (!cancelled) {
          const liked = new Set<string>();
          for (const [id, status] of statusMap) {
            if (status.liked) liked.add(id);
          }
          setLikedDeetIds(liked);
        }
      } catch {
        // Silently fail — buttons will just start at 0
      }
    }

    void fetchLikeStatus();
    return () => { cancelled = true; };
  }, [feedItems]);

  const handleToggleLike = useCallback(async (deetId: string) => {
    if (likingDeetIds.has(deetId)) return;

    setLikingDeetIds((prev) => new Set(prev).add(deetId));

    try {
      const result = await toggleDeetLike(deetId);
      setLikedDeetIds((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(deetId);
        else next.delete(deetId);
        return next;
      });
    } catch {
      // Silently fail
    } finally {
      setLikingDeetIds((prev) => {
        const next = new Set(prev);
        next.delete(deetId);
        return next;
      });
    }
  }, [likingDeetIds]);

  return {
    likedDeetIds,
    likingDeetIds,
    handleToggleLike,
  };
}
