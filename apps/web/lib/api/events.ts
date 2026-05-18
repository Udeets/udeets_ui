import { apiFetch } from "@/lib/api/client";
import type { EventRsvp, HubEvent } from "@/lib/services/events/event-types";

export type EventFeedItem = HubEvent & { hubName?: string };

export type CreateEventInput = {
  hubId: string;
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  coverImageUrl?: string;
};

export type UpdateEventInput = Partial<Omit<CreateEventInput, "hubId">>;

export async function listHubEventsApi(hubId: string): Promise<HubEvent[]> {
  const response = await apiFetch<{ events: HubEvent[] }>("/events", { query: { hubId } });
  return response.events ?? [];
}

export async function listUpcomingEventsFeedApi(limit = 50): Promise<EventFeedItem[]> {
  const response = await apiFetch<{ events: EventFeedItem[] }>("/events/feed", { query: { limit } });
  return response.events ?? [];
}

export async function createEventApi(input: CreateEventInput): Promise<HubEvent | null> {
  const response = await apiFetch<{ event: HubEvent }>("/events", { method: "POST", body: input });
  return response.event ?? null;
}

export async function updateEventApi(eventId: string, input: UpdateEventInput): Promise<HubEvent | null> {
  const response = await apiFetch<{ event: HubEvent }>(`/events/${eventId}`, { method: "PATCH", body: input });
  return response.event ?? null;
}

export async function deleteEventApi(eventId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/events/${eventId}`, { method: "DELETE" });
  return Boolean(response.ok);
}

export async function upsertMyEventRsvpApi(
  eventId: string,
  status: EventRsvp["status"],
): Promise<EventRsvp | null> {
  const response = await apiFetch<{ rsvp: EventRsvp }>(`/events/${eventId}/rsvps/me`, {
    method: "PUT",
    body: { status },
  });
  return response.rsvp ?? null;
}

export async function getMyEventRsvpApi(eventId: string): Promise<EventRsvp | null> {
  const response = await apiFetch<{ rsvp: EventRsvp | null }>(`/events/${eventId}/rsvps/me`);
  return response.rsvp ?? null;
}

export async function getEventRsvpCountsApi(
  eventId: string,
): Promise<{ going: number; maybe: number; notGoing: number }> {
  const response = await apiFetch<{ counts: { going: number; maybe: number; notGoing: number } }>(
    `/events/${eventId}/rsvps/counts`,
  );
  return response.counts ?? { going: 0, maybe: 0, notGoing: 0 };
}

export async function listEventRsvpsApi(eventId: string): Promise<EventRsvp[]> {
  const response = await apiFetch<{ rsvps: EventRsvp[] }>(`/events/${eventId}/rsvps`);
  return response.rsvps ?? [];
}

export async function removeMyEventRsvpApi(eventId: string): Promise<boolean> {
  const response = await apiFetch<{ ok: boolean }>(`/events/${eventId}/rsvps/me`, { method: "DELETE" });
  return Boolean(response.ok);
}
