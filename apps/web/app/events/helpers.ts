import type { HubEventItem } from "@/lib/hub-content";
import type { EventThemeFilter } from "./types";

export function filterEvents(
  events: HubEventItem[],
  query: string,
  activeTheme: EventThemeFilter
) {
  const normalizedQuery = query.trim().toLowerCase();

  return events.filter((event) => {
    const matchesTheme = activeTheme === "All" || event.theme === activeTheme;
    const matchesQuery =
      !normalizedQuery ||
      event.title.toLowerCase().includes(normalizedQuery) ||
      event.hub.toLowerCase().includes(normalizedQuery) ||
      event.location.toLowerCase().includes(normalizedQuery) ||
      event.description.toLowerCase().includes(normalizedQuery) ||
      event.theme.toLowerCase().includes(normalizedQuery);

    return matchesTheme && matchesQuery;
  });
}
