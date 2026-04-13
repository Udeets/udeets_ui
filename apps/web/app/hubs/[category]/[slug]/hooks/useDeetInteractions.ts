"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toggleDeetLike, getDeetLikeStatus, addDeetComment, listDeetComments, incrementDeetView, type DeetComment } from "@/lib/services/deets/deet-interactions";
import type { HubContent } from "@/lib/hub-content";

/** Wraps a promise with a timeout so it never hangs indefinitely. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

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
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<string, number>>({});
  const [commentError, setCommentError] = useState<string | null>(null);

  // Refs for synchronous checks (avoids stale closure issues entirely)
  const loadedCommentDeetIds = useRef<Set<string>>(new Set());
  const loadingCommentDeetIds = useRef<Set<string>>(new Set());
  const submittingRef = useRef(false);

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

  // ── Comments: Toggle panel + load ──────────────────────────────────

  const handleToggleComments = useCallback(async (deetId: string) => {
    // Clear any previous error
    setCommentError(null);

    // Toggle panel open/close
    setExpandedCommentDeetId((prev) => (prev === deetId ? null : deetId));

    // If already loaded or currently loading, skip fetch
    if (loadedCommentDeetIds.current.has(deetId) || loadingCommentDeetIds.current.has(deetId)) {
      return;
    }

    // Mark as loading (ref for sync checks, state for UI)
    loadingCommentDeetIds.current.add(deetId);
    setCommentLoadingDeetIds((prev) => new Set(prev).add(deetId));

    try {
      const comments = await withTimeout(listDeetComments(deetId), 10_000, "Load comments");
      loadedCommentDeetIds.current.add(deetId);
      setCommentsByDeetId((prev) => ({ ...prev, [deetId]: comments }));
    } catch (error) {
      console.error("Failed to load comments:", error);
      // Set empty array so UI shows "No comments yet" instead of spinner
      setCommentsByDeetId((prev) => ({ ...prev, [deetId]: prev[deetId] ?? [] }));
      setCommentError("Couldn't load comments. Try again.");
    } finally {
      loadingCommentDeetIds.current.delete(deetId);
      setCommentLoadingDeetIds((prev) => {
        const next = new Set(prev);
        next.delete(deetId);
        return next;
      });
    }
  }, []);

  // ── Comments: Submit ───────────────────────────────────────────────

  const handleSubmitComment = useCallback(async (deetId: string, body: string): Promise<{ success: boolean }> => {
    // Guard against double-submit using ref (synchronous, no stale closure)
    if (submittingRef.current) return { success: false };
    submittingRef.current = true;
    setCommentSubmittingDeetId(deetId);
    setCommentError(null);

    try {
      const newComment = await withTimeout(addDeetComment(deetId, body), 10_000, "Submit comment");
      setCommentsByDeetId((prev) => ({
        ...prev,
        [deetId]: [...(prev[deetId] ?? []), newComment],
      }));
      // Update comment count so the badge refreshes immediately
      setCommentCountOverrides((prev) => ({
        ...prev,
        [deetId]: (prev[deetId] ?? 0) + 1,
      }));
      return { success: true };
    } catch (error) {
      console.error("Failed to submit comment:", error);
      setCommentError("Couldn't post comment. Please try again.");
      return { success: false };
    } finally {
      submittingRef.current = false;
      setCommentSubmittingDeetId(null);
    }
  }, []);

  // ── Views ──────────────────────────────────────────────────────────

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
    commentCountOverrides,
    commentError,
    handleToggleComments,
    handleSubmitComment,
  };
}
