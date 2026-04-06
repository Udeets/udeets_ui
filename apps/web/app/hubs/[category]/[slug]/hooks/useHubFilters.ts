"use client";

import { useMemo, useState } from "react";
import type { HubContent } from "@/lib/hub-content";

export function useHubFilters({
  allFeedItems,
  demoPostedText,
  demoPollEnabled,
}: {
  allFeedItems: HubContent["feed"];
  demoPostedText: string;
  demoPollEnabled: boolean;
}) {
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<
    "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos"
  >("Newest");
  const [isFeedSearchOpen, setIsFeedSearchOpen] = useState(false);
  const [isFeedFilterOpen, setIsFeedFilterOpen] = useState(false);

  const normalizedPostSearch = postSearchQuery.trim().toLowerCase();

  const filteredFeedItems = useMemo(() => {
    const searchedFeedItems = allFeedItems.filter((item) => {
      if (!normalizedPostSearch) return true;
      return [item.title, item.body, item.author, item.time].some((value) =>
        value.toLowerCase().includes(normalizedPostSearch)
      );
    });

    return searchedFeedItems.filter((item) => {
      if (feedFilter === "Newest" || feedFilter === "Oldest") return true;
      if (feedFilter === "Announcements") {
        return item.kind === "announcement" || item.kind === "notice";
      }
      if (feedFilter === "Events") return item.kind === "event";
      if (feedFilter === "Photos") return item.kind === "photo";
      if (feedFilter === "Polls") return item.kind === "announcement"; // polls stored as announcements currently
      return false;
    });
  }, [allFeedItems, feedFilter, normalizedPostSearch]);

  const showDemoPostedText =
    feedFilter !== "Events" &&
    feedFilter !== "Polls" &&
    feedFilter !== "Photos" &&
    Boolean(demoPostedText) &&
    (!normalizedPostSearch || demoPostedText.toLowerCase().includes(normalizedPostSearch));

  const demoPollSearchText =
    "free pet check-up in mechanicsville would you attend the complimentary pet wellness check this saturday";
  const showDemoPoll =
    (feedFilter === "Newest" ||
      feedFilter === "Oldest" ||
      feedFilter === "Polls" ||
      feedFilter === "Events") &&
    demoPollEnabled &&
    (!normalizedPostSearch || demoPollSearchText.includes(normalizedPostSearch));

  const toggleFeedSearch = () => {
    setIsFeedSearchOpen((current) => {
      const next = !current;
      if (!next) setPostSearchQuery("");
      return next;
    });
  };

  const toggleFeedFilter = () => {
    setIsFeedFilterOpen((current) => !current);
  };

  const selectFeedFilter = (
    value: "Newest" | "Oldest" | "Announcements" | "Events" | "Polls" | "Photos",
  ) => {
    setFeedFilter(value);
    setIsFeedFilterOpen(false);
  };

  return {
    postSearchQuery,
    setPostSearchQuery,
    feedFilter,
    isFeedSearchOpen,
    isFeedFilterOpen,
    normalizedPostSearch,
    filteredFeedItems,
    showDemoPostedText,
    showDemoPoll,
    toggleFeedSearch,
    toggleFeedFilter,
    selectFeedFilter,
  };
}
