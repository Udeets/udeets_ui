export interface HubEvent {
  id: string;
  hubId: string;
  title: string;
  description: string | null;
  eventDate: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM
  endTime: string | null;
  location: string | null;
  coverImageUrl: string | null;
  createdBy: string;
  createdAt: string;
}

export interface EventRsvp {
  eventId: string;
  userId: string;
  status: "going" | "maybe" | "not_going";
}
