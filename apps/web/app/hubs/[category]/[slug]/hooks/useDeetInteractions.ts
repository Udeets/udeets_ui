"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  toggleDeetLike,
  getDeetLikeStatus,
  addDeetComment,
  listDeetComments,
  editDeetComment,
  deleteDeetComment,
  syncDeetCommentCounts,
  incrementDeetView,
  listDeetViewers,
  type DeetComment,
  type DeetViewer,
} from "@/lib/services/deets/deet-interactions";
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
  const commentCountsSynced = useRef(false);

  // ── Sync comment counts on first load ─────────────────────────────
  // The denormalized comment_count on deets may be stale (especially
  // for deets created before the UPDATE RLS policy was added). This
  // heals the counts by reading the actual deet_comments rows.
  useEffect(() => {
    if (commentCountsSynced.current) return;
    const deetIds = feedItems.map((item) => item.id).filter(Boolean);
    if (!deetIds.length) return;
    commentCountsSynced.current = true;

    void syncDeetCommentCounts(deetIds)
      .then((counts) => {
        // Build overrides: difference between actual count and what feed item shows
        const overrides: Record<string, number> = {};
        for (const item of feedItems) {
          const actual = counts[item.id];
          if (actual != null && actual !== item.comments) {
            overrides[item.id] = actual - item.comments;
          }
        }
        if (Object.keys(overrides).length > 0) {
          setCommentCountOverrides((prev) => ({ ...prev, ...overrides }));
        }
      })
      .catch(() => { /* non-critical */ });
  }, [feedItems]);

  // ── Fetch like status when feed items change ──────────────────────
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

  // ── Comments: Edit ─────────────────────────────────────────────────

  const handleEditComment = useCallback(async (commentId: string, deetId: string, newBody: string): Promise<{ success: boolean }> => {
    setCommentError(null);
    try {
      await withTimeout(editDeetComment(commentId, newBody), 10_000, "Edit comment");
      // Update local state
      setCommentsByDeetId((prev) => {
        const existing = prev[deetId] ?? [];
        return {
          ...prev,
          [deetId]: existing.map((c) => (c.id === commentId ? { ...c, body: newBody.trim() } : c)),
        };
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to edit comment:", error);
      setCommentError("Couldn't edit comment. Please try again.");
      return { success: false };
    }
  }, []);

  // ── Comments: Delete ───────────────────────────────────────────────

  const handleDeleteComment = useCallback(async (commentId: string, deetId: string): Promise<{ success: boolean }> => {
    setCommentError(null);
    try {
      await withTimeout(deleteDeetComment(commentId, deetId), 10_000, "Delete comment");
      // Remove from local state
      setCommentsByDeetId((prev) => {
        const existing = prev[deetId] ?? [];
        return {
          ...prev,
          [deetId]: existing.filter((c) => c.id !== commentId),
        };
      });
      // Decrement count
      setCommentCountOverrides((prev) => ({
        ...prev,
        [deetId]: (prev[deetId] ?? 0) - 1,
      }));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setCommentError("Couldn't delete comment. Please try again.");
      return { success: false };
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

  // ── Viewers list ───────────────────────────────────────────────────

  const [viewersDeetId, setViewersDeetId] = useState<string | null>(null);
  const [viewersByDeetId, setViewersByDeetId] = useState<Record<string, DeetViewer[]>>({});
  const [viewersLoading, setViewersLoading] = useState(false);

  const handleToggleViewers = useCallback(async (deetId: string) => {
    if (viewersDeetId === deetId) {
      setViewersDeetId(null);
      return;
    }
    setViewersDeetId(deetId);

    // Load if not cached
    if (viewersByDeetId[deetId]) return;

    setViewersLoading(true);
    try {
      const viewers = await withTimeout(listDeetViewers(deetId), 10_000, "Load viewers");
      setViewersByDeetId((prev) => ({ ...prev, [deetId]: viewers }));
    } catch {
      setViewersByDeetId((prev) => ({ ...prev, [deetId]: [] }));
    } finally {
      setViewersLoading(false);
    }
  }, [viewersDeetId, viewersByDeetId]);

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
    handleEditComment,
    handleDeleteComment,
    viewersDeetId,
    viewersByDeetId,
    viewersLoading,
    handleToggleViewers,
  };
}
