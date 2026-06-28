import {
  getEventRsvpCountsApi,
  getMyEventRsvpApi,
  listEventRsvpsApi,
  removeMyEventRsvpApi,
  upsertMyEventRsvpApi,
} from "@/lib/api/events";
import type { EventRsvp } from "./event-types";

/**
 * Creates or updates an RSVP for an event
 */
export async function rsvpToEvent(
  eventId: string,
  userId: string,
  status: "going" | "maybe" | "not_going"
): Promise<EventRsvp | null> {
  // `userId` kept for backward compatibility with existing callers.
  void userId;
  try {
    return await upsertMyEventRsvpApi(eventId, status);
  } catch (error) {
    console.error("Error creating/updating RSVP:", error);
    return null;
  }
}

/**
 * Fetches all RSVPs for an event
 */
export async function getEventRsvps(eventId: string): Promise<EventRsvp[]> {
  try {
    return await listEventRsvpsApi(eventId);
  } catch (error) {
    console.error("Error fetching event RSVPs:", error);
    return [];
  }
}

/**
 * Gets the RSVP status for a specific user and event
 */
export async function getUserRsvp(
  eventId: string,
  userId: string
): Promise<EventRsvp | null> {
  // `userId` kept for backward compatibility with existing callers.
  void userId;
  try {
    return await getMyEventRsvpApi(eventId);
  } catch (error) {
    console.error("Error fetching user RSVP:", error);
    return null;
  }
}

/**
 * Removes an RSVP
 */
export async function removeRsvp(eventId: string, userId: string): Promise<boolean> {
  // `userId` kept for backward compatibility with existing callers.
  void userId;
  try {
    return await removeMyEventRsvpApi(eventId);
  } catch (error) {
    console.error("Error removing RSVP:", error);
    return false;
  }
}

/**
 * Gets RSVP count by status for an event
 */
export async function getEventRsvpCounts(
  eventId: string
): Promise<{ going: number; maybe: number; notGoing: number }> {
  try {
    return await getEventRsvpCountsApi(eventId);
  } catch (error) {
    console.error("Error fetching RSVP counts:", error);
    return { going: 0, maybe: 0, notGoing: 0 };
  }
}
