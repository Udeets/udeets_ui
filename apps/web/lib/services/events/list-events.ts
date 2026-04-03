import { createClient } from "@/lib/supabase/client";
import type { HubEvent } from "./event-types";

/**
 * Fetches all events for a hub, ordered by event date
 */
export async function listHubEvents(hubId: string): Promise<HubEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("hub_id", hubId)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Error fetching hub events:", error);
    return [];
  }

  return (data || [])// eslint-disable-next-line @typescript-eslint/no-explicit-any
.map((row: any) => ({
    id: row.id,
    hubId: row.hub_id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    coverImageUrl: row.cover_image_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}

/**
 * Fetches events for a specific month
 */
export async function getEventsForMonth(
  hubId: string,
  year: number,
  month: number
): Promise<HubEvent[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = new Date(year, month + 1, 0);
  const endDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("hub_id", hubId)
    .gte("event_date", startDate)
    .lte("event_date", endDateStr)
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Error fetching events for month:", error);
    return [];
  }

  return (data || [])// eslint-disable-next-line @typescript-eslint/no-explicit-any
.map((row: any) => ({
    id: row.id,
    hubId: row.hub_id,
    title: row.title,
    description: row.description,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    coverImageUrl: row.cover_image_url,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));
}
