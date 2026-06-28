import { listHubEventsApi } from "@/lib/api/events";
import type { HubEvent } from "./event-types";

/**
 * Fetches all events for a hub, ordered by event date
 */
export async function listHubEvents(hubId: string): Promise<HubEvent[]> {
  try {
    return await listHubEventsApi(hubId);
  } catch (error) {
    console.error("Error fetching hub events:", error);
    return [];
  }
}

/**
 * Fetches events for a specific month
 */
export async function getEventsForMonth(
  hubId: string,
  year: number,
  month: number
): Promise<HubEvent[]> {
  const all = await listHubEvents(hubId);
  const startDate = new Date(year, month, 1).getTime();
  const endDate = new Date(year, month + 1, 0).getTime();
  try {
    return all.filter((event) => {
      const date = new Date(`${event.eventDate}T00:00:00`).getTime();
      return Number.isFinite(date) && date >= startDate && date <= endDate;
    });
  } catch (error) {
    console.error("Error filtering events for month:", error);
    return [];
  }
}
