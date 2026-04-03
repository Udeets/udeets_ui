import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .insert([
      {
        hub_id: params.hubId,
        title: params.title,
        description: params.description || null,
        event_date: params.eventDate,
        start_time: params.startTime || null,
        end_time: params.endTime || null,
        location: params.location || null,
        cover_image_url: params.coverImageUrl || null,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating event:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    hubId: data.hub_id,
    title: data.title,
    description: data.description,
    eventDate: data.event_date,
    startTime: data.start_time,
    endTime: data.end_time,
    location: data.location,
    coverImageUrl: data.cover_image_url,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

/**
 * Updates an existing event
 */
export async function updateEvent(eventId: string, params: UpdateEventParams): Promise<HubEvent | null> {
  const updateData: Record<string, unknown> = {};

  if (params.title !== undefined) updateData.title = params.title;
  if (params.description !== undefined) updateData.description = params.description;
  if (params.eventDate !== undefined) updateData.event_date = params.eventDate;
  if (params.startTime !== undefined) updateData.start_time = params.startTime;
  if (params.endTime !== undefined) updateData.end_time = params.endTime;
  if (params.location !== undefined) updateData.location = params.location;
  if (params.coverImageUrl !== undefined) updateData.cover_image_url = params.coverImageUrl;
  updateData.updated_at = new Date().toISOString();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .select()
    .single();

  if (error) {
    console.error("Error updating event:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    hubId: data.hub_id,
    title: data.title,
    description: data.description,
    eventDate: data.event_date,
    startTime: data.start_time,
    endTime: data.end_time,
    location: data.location,
    coverImageUrl: data.cover_image_url,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

/**
 * Deletes an event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    console.error("Error deleting event:", error);
    return false;
  }

  return true;
}
