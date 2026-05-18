import { createEventApi, deleteEventApi, updateEventApi } from "@/lib/api/events";
import type { HubEvent } from "./event-types";

export interface CreateEventParams {
  hubId: string;
  title: string;
  description?: string;
  eventDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;
  location?: string;
  coverImageUrl?: string;
}

export interface UpdateEventParams {
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  coverImageUrl?: string;
}

/**
 * Creates a new event in the database
 */
export async function createEvent(params: CreateEventParams, userId: string): Promise<HubEvent | null> {
  // `userId` kept for backward compatibility with existing callers;
  // FastAPI resolves actor identity from bearer token.
  void userId;
  try {
    return await createEventApi({
      hubId: params.hubId,
      title: params.title,
      description: params.description,
      eventDate: params.eventDate,
      startTime: params.startTime,
      endTime: params.endTime,
      location: params.location,
      coverImageUrl: params.coverImageUrl,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return null;
  }
}

/**
 * Updates an existing event
 */
export async function updateEvent(eventId: string, params: UpdateEventParams): Promise<HubEvent | null> {
  try {
    return await updateEventApi(eventId, {
      title: params.title,
      description: params.description,
      eventDate: params.eventDate,
      startTime: params.startTime,
      endTime: params.endTime,
      location: params.location,
      coverImageUrl: params.coverImageUrl,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return null;
  }
}

/**
 * Deletes an event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    return await deleteEventApi(eventId);
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
}
