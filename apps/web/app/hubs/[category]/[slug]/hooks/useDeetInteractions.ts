"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  toggleDeetLike,
  getDeetLikeStatus,
  getDeetReactorPreviews,
  listDeetReactors,
  addDeetComment,
  listDeetComments,
  editDeetComment,
  deleteDeetComment,
  syncDeetCommentCounts,
  syncDeetViewCounts,
  incrementDeetView,
  listDeetViewers,
  type DeetComment,
  type DeetViewer,
  type DeetReactor,
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
  /** Canonical emoji per deet for the signed-in user (only keys where the user has reacted). */
  const [myReactionsByDeetId, setMyReactionsByDeetId] = useState<Record<string, string>>({});
  const [likingDeetIds, setLikingDeetIds] = useState<Set<string>>(new Set());
  const [likeCountOverrides, setLikeCountOverrides] = useState<Record<string, number>>({});
  const viewedDeetIds = useRef<Set<string>>(new Set());
  const [viewCountOverrides, setViewCountOverrides] = useState<Record<string, number>>({});

  // Reactors preview (avatars + emoji for the row below content)
  const [reactorsByDeetId, setReactorsByDeetId] = useState<Record<string, DeetReactor[]>>({});
  // Reactions modal
  const [reactionsModalDeetId, setReactionsModalDeetId] = useState<string | null>(null);
  const [reactionsModalData, setReactionsModalData] = useState<DeetReactor[]>([]);
  const [reactionsModalLoading, setReactionsModalLoading] = useState(false);

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
  const viewCountsSynced = useRef(false);
  /** Bumps when the like-status effect re-runs so in-flight fetches cannot apply stale snapshots. */
  const likeStatusFetchGen = useRef(0);

  // ── Sync view counts on first load ────────────────────────────────
  // The denormalized view_count on deets may be stale. Heal by reading
  // actual deet_views rows and computing overrides.
  useEffect(() => {
    if (viewCountsSynced.current) return;
    const deetIds = feedItems.map((item) => item.id).filter(Boolean);
    if (!deetIds.length) return;
    viewCountsSynced.current = true;

    void syncDeetViewCounts(deetIds)
      .then((counts) => {
        const overrides: Record<string, number> = {};
        for (const item of feedItems) {
          const actual = counts[item.id];
          if (actual != null && actual !== item.views) {
            overrides[item.id] = actual - item.views;
          }
        }
        if (Object.keys(overrides).length > 0) {
          setViewCountOverrides((prev) => ({ ...prev, ...overrides }));
        }
      })
      .catch(() => { /* non-critical */ });
  }, [feedItems]);

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

    const myGen = ++likeStatusFetchGen.current;
    let cancelled = false;

    async function fetchLikeStatus() {
      try {
        const [statusMap, reactorPreviews] = await Promise.all([
          getDeetLikeStatus(deetIds),
          getDeetReactorPreviews(deetIds),
        ]);
        if (!cancelled && myGen === likeStatusFetchGen.current) {
          const liked = new Set<string>();
          const counts: Record<string, number> = {};
          const reactions: Record<string, string> = {};
          for (const [id, status] of statusMap) {
            if (status.liked) {
              liked.add(id);
              if (status.myReactionType) reactions[id] = status.myReactionType;
            }
            counts[id] = status.count;
          }
          setLikedDeetIds(liked);
          setMyReactionsByDeetId(reactions);
          setLikeCountOverrides(counts);
          setReactorsByDeetId(reactorPreviews);
        }
      } catch {
        // Silently fail — buttons will just start at 0
      }
    }

    void fetchLikeStatus();
    return () => { cancelled = true; };
  }, [feedItems]);

  const handleToggleLike = useCallback(async (deetId: string, reactionType = "like") => {
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
      const result = await toggleDeetLike(deetId, reactionType);
      setLikedDeetIds((prev) => {
        const next = new Set(prev);
        if (result.liked) next.add(deetId);
        else next.delete(deetId);
        return next;
      });
      setMyReactionsByDeetId((prev) => {
        const next = { ...prev };
        if (result.liked && result.myReactionType) next[deetId] = result.myReactionType;
        else delete next[deetId];
        return next;
      });
      setLikeCountOverrides((prev) => ({ ...prev, [deetId]: result.likeCount }));
      // Refresh reactor previews for this deet
      void getDeetReactorPreviews([deetId]).then((previews) => {
        setReactorsByDeetId((prev) => ({ ...prev, ...previews }));
      }).catch(() => {});
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

  // ── Comments: load (shared by toggle, deep-link, image viewer) ─────

  const loadCommentsForDeetIfNeeded = useCallback(async (deetId: string) => {
    if (loadedCommentDeetIds.current.has(deetId) || loadingCommentDeetIds.current.has(deetId)) {
      return;
    }

    setCommentError(null);
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

  /** Open the inline comments panel for this deet (no toggle). Used for ?comments=1 deep links. */
  const openCommentsPanelForDeet = useCallback(
    async (deetId: string) => {
      setCommentError(null);
      setExpandedCommentDeetId(deetId);
      await loadCommentsForDeetIfNeeded(deetId);
    },
    [loadCommentsForDeetIfNeeded],
  );

  const handleToggleComments = useCallback(
    async (deetId: string) => {
      setCommentError(null);
      let opening = false;
      setExpandedCommentDeetId((prev) => {
        opening = prev !== deetId;
        return prev === deetId ? null : deetId;
      });
      if (opening) await loadCommentsForDeetIfNeeded(deetId);
    },
    [loadCommentsForDeetIfNeeded],
  );

  // ── Comments: Submit ───────────────────────────────────────────────

  // ── Reactions modal ─────────────────────────────────────────────────

  const handleOpenReactionsModal = useCallback(async (deetId: string) => {
    setReactionsModalDeetId(deetId);
    setReactionsModalLoading(true);
    try {
      const reactors = await withTimeout(listDeetReactors(deetId), 10_000, "Load reactors");
      setReactionsModalData(reactors);
    } catch {
      setReactionsModalData([]);
    } finally {
      setReactionsModalLoading(false);
    }
  }, []);

  const handleCloseReactionsModal = useCallback(() => {
    setReactionsModalDeetId(null);
    setReactionsModalData([]);
  }, []);

  // ── Comments: Submit (supports parentId for replies) ──────────────

  const handleSubmitComment = useCallback(async (
    deetId: string,
    body: string,
    parentId?: string,
    attachments?: { imageUrl?: string; attachmentUrl?: string; attachmentName?: string },
  ): Promise<{ success: boolean }> => {
    if (submittingRef.current) return { success: false };
    submittingRef.current = true;
    setCommentSubmittingDeetId(deetId);
    setCommentError(null);

    try {
      const newComment = await withTimeout(addDeetComment(deetId, body, parentId, attachments), 10_000, "Submit comment");
      if (parentId) {
        // Add reply under its parent
        setCommentsByDeetId((prev) => {
          const existing = prev[deetId] ?? [];
          return {
            ...prev,
            [deetId]: existing.map((c) =>
              c.id === parentId ? { ...c, replies: [...(c.replies ?? []), newComment] } : c
            ),
          };
        });
      } else {
        // Top-level comment
        setCommentsByDeetId((prev) => ({
          ...prev,
          [deetId]: [...(prev[deetId] ?? []), { ...newComment, replies: [] }],
        }));
      }
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
      const isNew = await incrementDeetView(deetId);
      if (isNew) {
        setViewCountOverrides((prev) => ({
          ...prev,
          [deetId]: (prev[deetId] ?? 0) + 1,
        }));
      }
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

  /** Load viewers into cache without opening the feed card dropdown (e.g. hub image viewer overlay). */
  const prefetchViewersForDeet = useCallback(async (deetId: string) => {
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
  }, [viewersByDeetId]);

  return {
    likedDeetIds,
    myReactionsByDeetId,
    likingDeetIds,
    likeCountOverrides,
    viewCountOverrides,
    handleToggleLike,
    handleIncrementView,
    // Reactors
    reactorsByDeetId,
    reactionsModalDeetId,
    reactionsModalData,
    reactionsModalLoading,
    handleOpenReactionsModal,
    handleCloseReactionsModal,
    // Comments
    expandedCommentDeetId,
    commentsByDeetId,
    commentLoadingDeetIds,
    commentSubmittingDeetId,
    commentCountOverrides,
    commentError,
    handleToggleComments,
    openCommentsPanelForDeet,
    loadCommentsForDeetIfNeeded,
    handleSubmitComment,
    handleEditComment,
    handleDeleteComment,
    // Viewers
    viewersDeetId,
    viewersByDeetId,
    viewersLoading,
    handleToggleViewers,
    prefetchViewersForDeet,
  };
}
