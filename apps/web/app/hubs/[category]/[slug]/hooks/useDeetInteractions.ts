"use client";

import { useCallback, useEffect, useState } from "react";
import { toggleDeetLike, getDeetLikeStatus, addDeetComment, listDeetComments, type DeetComment } from "@/lib/services/deets/deet-interactions";
import type { HubContent } from "@/lib/hub-content";

export function useDeetInteractions(feedItems: HubContent["feed"]) {
  const [likedDeetIds, setLikedDeetIds] = useState<Set<string>>(new Set());
  const [likingDeetIds, setLikingDeetIds] = useState<Set<string>>(new Set());
  const [likeCountOverrides, setLikeCountOverrides] = useState<Record<string, number>>({});

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
  }, [likingDeetIds]);

  const handleToggleComments = useCallback(async (deetId: string) => {
    if (expandedCommentDeetId === deetId) {
      // Close comments
      setExpandedCommentDeetId(null);
    } else {
      // Open comments — load them if not already cached
      setExpandedCommentDeetId(deetId);
      if (!commentsByDeetId[deetId] && !commentLoadingDeetIds.has(deetId)) {
        setCommentLoadingDeetIds((prev) => new Set(prev).add(deetId));
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
      }
    }
  }, [expandedCommentDeetId, commentsByDeetId, commentLoadingDeetIds]);

  const handleSubmitComment = useCallback(async (deetId: string, body: string) => {
    if (commentSubmittingDeetId) return;

    setCommentSubmittingDeetId(deetId);
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
  }, [commentSubmittingDeetId]);

  return {
    likedDeetIds,
    likingDeetIds,
    likeCountOverrides,
    handleToggleLike,
    expandedCommentDeetId,
    commentsByDeetId,
    commentLoadingDeetIds,
    commentSubmittingDeetId,
    handleToggleComments,
    handleSubmitComment,
  };
}
