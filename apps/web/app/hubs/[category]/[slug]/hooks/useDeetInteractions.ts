"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toggleDeetLike, getDeetLikeStatus, addDeetComment, listDeetComments, incrementDeetView, type DeetComment } from "@/lib/services/deets/deet-interactions";
import type { HubContent } from "@/lib/hub-content";

export function useDeetInteractions(feedItems: HubContent["feed"]) {
  const [likedDeetIds, setLikedDeetIds] = useState<Set<string>>(new Set());
  const [likingDeetIds, setLikingDeetIds] = useState<Set<string>>(new Set());
  const [likeCountOverrides, setLikeCountOverrides] = useState<Record<string, number>>({});
  const viewedDeetIds = useRef<Set<string>>(new Set());
  const [viewCountOverrides, setViewCountOverrides] = useState<Record<string, number>>({});

  // Comment state
  const [expandedCommentDeetId, setExpandedCommentDeetId] = useState<string | null>(null);
  const [commentsByDeetId, setCommentsByDeetId] = useState<Record<string, DeetComment[]>>({});
  const [commentLoadingDeetIds, setCommentLoadingDeetIds] = useState<Set<string>>(new Set());
  const [commentSubmittingDeetId, setCommentSubmittingDeetId] = useState<string | null>(null);

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
          const counts: Record<string, number> = {};
          for (const [id, status] of statusMap) {
            if (status.liked) liked.add(id);
            counts[id] = status.count;
          }
          setLikedDeetIds(liked);
          setLikeCountOverrides(counts);
        }
      } catch {
        // Silently fail — buttons will just start at 0
      }
    }

    void fetchLikeStatus();
    return () => { cancelled = true; };
  }, [feedItems]);

  const handleToggleLike = useCallback(async (deetId: string) => {
    // Use functional check to avoid stale closure on likingDeetIds
    let alreadyLiking = false;
    setLikingDeetIds((prev) => {
      if (prev.has(deetId)) {
        alreadyLiking = true;
        return prev;
      }
      return new Set(prev).add(deetId);
    });
    if (alreadyLiking) return;

    try {
      const result = await toggleDeetLike(deetId);
      setLikedDeetIds((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(deetId);
        else next.delete(deetId);
        return next;
      });
      setLikeCountOverrides((prev) => ({ ...prev, [deetId]: result.likeCount }));
    } catch {
      // Silently fail
    } finally {
      setLikingDeetIds((prev) => {
        const next = new Set(prev);
        next.delete(deetId);
        return next;
      });
    }
  }, []);

  const handleToggleComments = useCallback(async (deetId: string) => {
    // Use refs via setState to avoid stale closure on expandedCommentDeetId
    setExpandedCommentDeetId((prev) => {
      if (prev === deetId) return null; // Close if already open
      return deetId; // Open
    });

    // Load comments if not cached
    setCommentsByDeetId((prevComments) => {
      if (prevComments[deetId]) return prevComments; // Already cached

      // Kick off fetch (fire-and-forget from within setState, actual fetch below)
      return prevComments;
    });

    // Check cache and loading via functional updates to avoid stale refs
    let shouldLoad = false;
    setCommentLoadingDeetIds((prev) => {
      // Only proceed to load if not already loading
      if (prev.has(deetId)) return prev;
      shouldLoad = true;
      return new Set(prev).add(deetId);
    });

    if (!shouldLoad) return;

    // Check if already cached before fetching
    let alreadyCached = false;
    setCommentsByDeetId((prev) => {
      if (prev[deetId]) {
        alreadyCached = true;
        // Also clear loading flag
        setCommentLoadingDeetIds((loadPrev) => {
          const next = new Set(loadPrev);
          next.delete(deetId);
          return next;
        });
      }
      return prev;
    });
    if (alreadyCached) return;

    try {
      const comments = await listDeetComments(deetId);
      setCommentsByDeetId((prev) => ({
        ...prev,
        [deetId]: comments,
      }));
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setCommentLoadingDeetIds((prev) => {
        const next = new Set(prev);
        next.delete(deetId);
        return next;
      });
    }
  }, []);

  const handleSubmitComment = useCallback(async (deetId: string, body: string) => {
    // Use functional check to avoid stale closure
    let alreadySubmitting = false;
    setCommentSubmittingDeetId((prev) => {
      if (prev) {
        alreadySubmitting = true;
        return prev;
      }
      return deetId;
    });
    if (alreadySubmitting) return;

    try {
      const newComment = await addDeetComment(deetId, body);
      setCommentsByDeetId((prev) => {
        const existing = prev[deetId] ?? [];
        return {
          ...prev,
          [deetId]: [...existing, newComment],
        };
      });
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setCommentSubmittingDeetId(null);
    }
  }, []);

  // Increment view count once per deet per session
  const handleIncrementView = useCallback(async (deetId: string) => {
    if (viewedDeetIds.current.has(deetId)) return;
    viewedDeetIds.current.add(deetId);
    try {
      await incrementDeetView(deetId);
      setViewCountOverrides((prev) => ({
        ...prev,
        [deetId]: (prev[deetId] ?? 0) + 1,
      }));
    } catch {
      // Silently fail — view tracking is non-critical
    }
  }, []);

  // Auto-increment views for all feed items when they load
  useEffect(() => {
    for (const item of feedItems) {
      if (item.id && !viewedDeetIds.current.has(item.id)) {
        void handleIncrementView(item.id);
      }
    }
  }, [feedItems, handleIncrementView]);

  return {
    likedDeetIds,
    likingDeetIds,
    likeCountOverrides,
    viewCountOverrides,
    handleToggleLike,
    handleIncrementView,
    expandedCommentDeetId,
    commentsByDeetId,
    commentLoadingDeetIds,
    commentSubmittingDeetId,
    handleToggleComments,
    handleSubmitComment,
  };
}
