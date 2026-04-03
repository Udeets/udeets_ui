import { createClient } from "@/lib/supabase/client";
import type { EventRsvp } from "./event-types";

/**
 * Creates or updates an RSVP for an event
 */
export async function rsvpToEvent(
  eventId: string,
  userId: string,
  status: "going" | "maybe" | "not_going"
): Promise<EventRsvp | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_rsvps")
    .upsert(
      [
        {
          event_id: eventId,
          user_id: userId,
          status: status,
        },
      ],
      {
        onConflict: "event_id,user_id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating/updating RSVP:", error);
    return null;
  }

  if (!data) return null;

  return {
    eventId: data.event_id,
    userId: data.user_id,
    status: data.status,
  };
}

/**
 * Fetches all RSVPs for an event
 */
export async function getEventRsvps(eventId: string): Promise<EventRsvp[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching event RSVPs:", error);
    return [];
  }

  return (data || [])// eslint-disable-next-line @typescript-eslint/no-explicit-any
.map((row: any) => ({
    eventId: row.event_id,
    userId: row.user_id,
    status: row.status,
  }));
}

/**
 * Gets the RSVP status for a specific user and event
 */
export async function getUserRsvp(
  eventId: string,
  userId: string
): Promise<EventRsvp | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) {
    // No RSVP found is not an error
    if (error.code === "PGRST116") return null;
    console.error("Error fetching user RSVP:", error);
    return null;
  }

  if (!data) return null;

  return {
    eventId: data.event_id,
    userId: data.user_id,
    status: data.status,
  };
}

/**
 * Removes an RSVP
 */
export async function removeRsvp(eventId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing RSVP:", error);
    return false;
  }

  return true;
}

/**
 * Gets RSVP count by status for an event
 */
export async function getEventRsvpCounts(
  eventId: string
): Promise<{ going: number; maybe: number; notGoing: number }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching RSVP counts:", error);
    return { going: 0, maybe: 0, notGoing: 0 };
  }

  const counts = { going: 0, maybe: 0, notGoing: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
(data || []).forEach((row: any) => {
    if (row.status === "going") counts.going++;
    else if (row.status === "maybe") counts.maybe++;
    else if (row.status === "not_going") counts.notGoing++;
  });

  return counts;
}
