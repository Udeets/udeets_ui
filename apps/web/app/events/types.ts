import type { HubEventItem, HubEventTheme } from "@/lib/hub-content";

export type EventThemeFilter = "All" | HubEventTheme;

export type EventCardProps = {
  event: HubEventItem;
};
