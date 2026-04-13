"use client";

import { useState } from "react";
import type { ViewerState, ViewerCommentContext } from "../components/hubTypes";

export function useHubViewerState() {
  const [viewer, setViewer] = useState<ViewerState>({
    open: false,
    images: [],
    index: 0,
    title: "",
    body: "",
    focusId: undefined,
    commentContext: undefined,
  });

  const openViewer = (
    images: string[],
    index: number,
    title: string,
    body: string,
    focusId?: string,
    commentContext?: ViewerCommentContext,
  ) => {
    if (!images.length) return;
    setViewer({ open: true, images, index, title, body, focusId, commentContext });
  };

  const closeViewer = () => {
    setViewer((current) => ({ ...current, open: false }));
  };

  const nextViewerImage = () => {
    setViewer((current) => ({
      ...current,
      index: (current.index + 1) % current.images.length,
    }));
  };

  const prevViewerImage = () => {
    setViewer((current) => ({
      ...current,
      index: current.index === 0 ? current.images.length - 1 : current.index - 1,
    }));
  };

  return {
    viewer,
    openViewer,
    closeViewer,
    nextViewerImage,
    prevViewerImage,
  };
}
