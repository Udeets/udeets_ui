"use client";

import { useState, useMemo, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, X } from "lucide-react";
import { cn } from "../hubUtils";
import { listHubEvents } from "@/lib/services/events/list-events";
import { createEvent, deleteEvent } from "@/lib/services/events/create-event";
import { rsvpToEvent, getUserRsvp, getEventRsvpCounts } from "@/lib/services/events/event-rsvps";
import type { HubEvent } from "@/lib/services/events/event-types";

/* ── constants ───────────────────────────────────────────────────── */

const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/* ── date helpers ────────────────────────────────────────────────── */

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(d: Date) { return isSameDay(d, new Date()); }

function getMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[][] {
  const startDow = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startDow);
  const rows: { date: Date; inMonth: boolean }[][] = [];
  const cursor = new Date(gridStart);
  for (let r = 0; r < 6; r++) {
    const row: { date: Date; inMonth: boolean }[] = [];
    for (let c = 0; c < 7; c++) {
      row.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month && cursor.getFullYear() === year });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }
  if (rows[rows.length - 1].every((c) => !c.inMonth)) rows.pop();
  return rows;
}

function dateToString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateString(dateStr: string): Date | null {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return Number.isNaN(d.getTime()) ? null : d;
}

const GRID7: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" };

/* ── component ───────────────────────────────────────────────────── */

export function EventsSection({
  hubId,
  userId,
  isCreatorAdmin,
}: {
  hubId: string;
  userId: string | null;
  isCreatorAdmin: boolean;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [popupEvent, setPopupEvent] = useState<HubEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormDate, setCreateFormDate] = useState<string>(dateToString(today));
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [userRsvps, setUserRsvps] = useState<Map<string, "going" | "maybe" | "not_going">>(new Map());
  const [rsvpCounts, setRsvpCounts] = useState<Map<string, { going: number; maybe: number; notGoing: number }>>(new Map());

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  });

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Load events
  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      const data = await listHubEvents(hubId);
      setEvents(data);

      const rsvps = new Map<string, "going" | "maybe" | "not_going">();
      const counts = new Map<string, { going: number; maybe: number; notGoing: number }>();

      for (const event of data) {
        if (userId) {
          const userRsvp = await getUserRsvp(event.id, userId);
          if (userRsvp) rsvps.set(event.id, userRsvp.status);
        }
        const eventCounts = await getEventRsvpCounts(event.id);
        counts.set(event.id, eventCounts);
      }

      setUserRsvps(rsvps);
      setRsvpCounts(counts);
      setLoading(false);
    }

    loadEvents();
  }, [hubId, userId]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, HubEvent[]>();
    for (const ev of events) {
      const k = ev.eventDate;
      map.set(k, [...(map.get(k) ?? []), ev]);
    }
    return map;
  }, [events]);

  function eventsOn(d: Date) { return eventsByDate.get(dateToString(d)) ?? []; }

  function shiftMonth(dir: -1 | 1) {
    const n = new Date(viewYear, viewMonth + dir, 1);
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth());
  }

  function goToToday() {
    const n = new Date();
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth());
  }

  function openCreateForDate(date: Date) {
    setCreateFormDate(dateToString(date));
    setCreateForm({ title: "", description: "", startTime: "", endTime: "", location: "" });
    setShowCreateModal(true);
  }

  // Group all events by month for the list view
  const eventsByMonth = useMemo(() => {
    const sorted = [...events].sort((a, b) => {
      const da = parseDateString(a.eventDate)?.getTime() ?? 0;
      const db = parseDateString(b.eventDate)?.getTime() ?? 0;
      return da - db;
    });

    const groups: { label: string; events: HubEvent[] }[] = [];
    let currentLabel = "";
    let currentGroup: HubEvent[] = [];

    for (const ev of sorted) {
      const d = parseDateString(ev.eventDate);
      if (!d) continue;
      const label = `${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (label !== currentLabel) {
        if (currentGroup.length > 0) groups.push({ label: currentLabel, events: currentGroup });
        currentLabel = label;
        currentGroup = [ev];
      } else {
        currentGroup.push(ev);
      }
    }
    if (currentGroup.length > 0) groups.push({ label: currentLabel, events: currentGroup });

    return groups;
  }, [events]);

  async function handleCreateEvent() {
    if (!createForm.title.trim() || !userId) return;

    const newEvent = await createEvent({
      hubId,
      title: createForm.title,
      description: createForm.description || undefined,
      eventDate: createFormDate,
      startTime: createForm.startTime || undefined,
      endTime: createForm.endTime || undefined,
      location: createForm.location || undefined,
    }, userId);

    if (newEvent) {
      setEvents([...events, newEvent]);
      setRsvpCounts(new Map(rsvpCounts).set(newEvent.id, { going: 0, maybe: 0, notGoing: 0 }));
      setCreateForm({ title: "", description: "", startTime: "", endTime: "", location: "" });
      setShowCreateModal(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    if (await deleteEvent(eventId)) {
      setEvents(events.filter(e => e.id !== eventId));
      setPopupEvent(null);
      const newRsvpCounts = new Map(rsvpCounts);
      newRsvpCounts.delete(eventId);
      setRsvpCounts(newRsvpCounts);
    }
  }

  async function handleRsvp(eventId: string, status: "going" | "maybe" | "not_going") {
    if (!userId) return;

    await rsvpToEvent(eventId, userId, status);

    const newRsvps = new Map(userRsvps);
    newRsvps.set(eventId, status);
    setUserRsvps(newRsvps);

    const counts = await getEventRsvpCounts(eventId);
    const newCounts = new Map(rsvpCounts);
    newCounts.set(eventId, counts);
    setRsvpCounts(newCounts);
  }

  /* ── render helpers ──────────────────────────────────────────── */

  function renderEventListItem(ev: HubEvent) {
    const parsed = parseDateString(ev.eventDate);
    if (!parsed) return null;

    return (
      <button
        key={ev.id}
        id={ev.id}
        type="button"
        onClick={() => setPopupEvent(ev)}
        className="flex w-full items-center gap-4 border-b border-[var(--ud-border-subtle)] py-4 text-left transition hover:bg-[var(--ud-bg-subtle)]/40"
      >
        {/* Date number + short day */}
        <div className="flex w-12 shrink-0 flex-col items-center">
          <span className="text-2xl font-bold leading-none text-[var(--ud-text-primary)]">
            {parsed.getDate()}
          </span>
          <span className="mt-0.5 text-[11px] text-[var(--ud-text-muted)]">
            {SHORT_DAY[parsed.getDay()]}
          </span>
        </div>

        {/* Divider line */}
        <div className="h-10 w-px bg-[var(--ud-border)]" />

        {/* Event title */}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[var(--ud-text-primary)]">{ev.title}</p>
          {ev.startTime && (
            <p className="mt-0.5 text-[12px] text-[var(--ud-text-muted)]">
              {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ""}
            </p>
          )}
        </div>

        {/* Green calendar icon */}
        <CalendarDays className="h-5 w-5 shrink-0 text-[#0C5C57]" />
      </button>
    );
  }

  /* ── render ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <section className="w-full min-w-0 bg-[var(--ud-bg-card)] px-1 py-5">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-[var(--ud-text-muted)]">Loading events...</p>
        </div>
      </section>
    );
  }

  return (
    <>
    <section className="w-full min-w-0 bg-[var(--ud-bg-card)]">
      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between px-4 pb-4">
        <h2 className="text-lg font-semibold text-[var(--ud-text-primary)]">Events</h2>
        <button
          type="button"
          onClick={() => {
            setCreateFormDate(dateToString(today));
            setCreateForm({ title: "", description: "", startTime: "", endTime: "", location: "" });
            setShowCreateModal(true);
          }}
          className="hidden rounded-full border border-[var(--ud-brand-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--ud-brand-primary)] transition hover:bg-[var(--ud-brand-light)] lg:inline-flex"
        >
          Add Event
        </button>
      </div>

      {/* ═══ Calendar View toggle button (Band-style) ═══ */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition",
            viewMode === "list"
              ? "bg-[#E8F5F3] text-[#0C5C57]"
              : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-secondary)]"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          {viewMode === "list" ? "Calendar View" : "List View"}
        </button>
      </div>

      {/* ═══ CALENDAR VIEW ═══ */}
      {viewMode === "calendar" && (
        <div className="px-4">
          {/* Month nav */}
          <div className="flex items-center justify-between pb-4">
            <button
              type="button"
              onClick={goToToday}
              className="text-sm font-medium text-[var(--ud-text-secondary)]"
            >
              Today
            </button>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => shiftMonth(-1)} className="p-1 text-[var(--ud-text-muted)]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-base font-bold text-[var(--ud-text-primary)]">
                {SHORT_MONTHS[viewMonth]} {viewYear}
              </span>
              <button type="button" onClick={() => shiftMonth(1)} className="p-1 text-[var(--ud-text-muted)]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[var(--ud-text-muted)]" />
            </div>
          </div>

          {/* Day headers */}
          <div style={GRID7} className="pb-2">
            {DAY_HEADERS.map((d) => (
              <span key={d} className="text-center text-[11px] font-medium text-[var(--ud-text-muted)]">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid — clean, no borders (Band-style) */}
          {grid.map((row, ri) => (
            <div key={ri} style={GRID7}>
              {row.map((cell) => {
                const todayCell = isToday(cell.date);
                const hasEvents = eventsOn(cell.date).length > 0;

                return (
                  <button
                    key={cell.date.toISOString()}
                    type="button"
                    onClick={() => {
                      if (isCreatorAdmin) {
                        openCreateForDate(cell.date);
                      }
                    }}
                    className={cn(
                      "flex h-10 items-center justify-center text-sm transition",
                      !cell.inMonth && "text-gray-300",
                      cell.inMonth && !todayCell && "text-[var(--ud-text-primary)]",
                      todayCell && "font-bold",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        todayCell && "bg-[#0C5C57] text-white",
                        hasEvents && !todayCell && "ring-2 ring-[#0C5C57]/30"
                      )}
                    >
                      {cell.date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Collapse indicator */}
          <div className="flex justify-center pb-2 pt-1">
            <ChevronLeft className="h-4 w-4 rotate-90 text-[var(--ud-text-muted)]" />
          </div>
        </div>
      )}

      {/* ═══ EVENT LIST — grouped by month (Band-style) ═══ */}
      <div className="px-4">
        {eventsByMonth.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CalendarDays className="h-8 w-8 text-[var(--ud-text-muted)]" />
            <p className="mt-3 text-sm font-medium text-[var(--ud-text-primary)]">No events scheduled.</p>
            <p className="mt-0.5 text-[13px] text-[var(--ud-text-muted)]">
              Plan the first event for your hub.
            </p>
          </div>
        ) : (
          eventsByMonth.map((group) => (
            <div key={group.label}>
              {/* Month header */}
              <div className="bg-[#F0F8F6] px-3 py-2 text-sm font-semibold text-[var(--ud-text-secondary)]">
                {group.label}
              </div>
              {/* Event items */}
              {group.events.map((ev) => renderEventListItem(ev))}
            </div>
          ))
        )}
      </div>

      {/* ═══ EVENT DETAIL POPUP ═══ */}
      {popupEvent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={() => setPopupEvent(null)}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-[var(--ud-bg-card)] shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-2xl bg-[#0C5C57] px-5 py-3.5 sm:rounded-t-2xl">
              <h3 className="text-sm font-semibold text-white">{popupEvent.title}</h3>
              <button type="button" onClick={() => setPopupEvent(null)} className="text-white/60 transition hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {popupEvent.description && (
                <p className="pb-4 text-sm text-[var(--ud-text-secondary)]">{popupEvent.description}</p>
              )}

              <div className="space-y-3 border-t border-[var(--ud-border)] pt-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-[var(--ud-text-muted)]" />
                  <span className="text-sm text-[var(--ud-text-primary)]">
                    {parseDateString(popupEvent.eventDate)?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                {popupEvent.startTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[var(--ud-text-muted)]" />
                    <span className="text-sm text-[var(--ud-text-primary)]">
                      {popupEvent.startTime}{popupEvent.endTime ? ` - ${popupEvent.endTime}` : ""}
                    </span>
                  </div>
                )}
                {popupEvent.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[var(--ud-text-muted)]" />
                    <span className="text-sm text-[var(--ud-text-primary)]">{popupEvent.location}</span>
                  </div>
                )}
              </div>

              {/* RSVP */}
              <div className="mt-5 border-t border-[var(--ud-border)] pt-4">
                <p className="mb-3 text-xs font-semibold text-[var(--ud-text-secondary)]">RSVP</p>
                <div className="flex gap-2">
                  {(["going", "maybe", "not_going"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleRsvp(popupEvent.id, status)}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-xs font-semibold transition",
                        userRsvps.get(popupEvent.id) === status
                          ? status === "going" ? "bg-green-100 text-green-700"
                            : status === "maybe" ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                          : "border border-[var(--ud-border)] text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
                      )}
                    >
                      {status === "going" ? "Going" : status === "maybe" ? "Maybe" : "Not Going"}
                    </button>
                  ))}
                </div>

                {rsvpCounts.get(popupEvent.id) && (
                  <div className="mt-3 flex gap-4 text-xs text-[var(--ud-text-secondary)]">
                    <span>{rsvpCounts.get(popupEvent.id)!.going} Going</span>
                    <span>{rsvpCounts.get(popupEvent.id)!.maybe} Maybe</span>
                    <span>{rsvpCounts.get(popupEvent.id)!.notGoing} Not Going</span>
                  </div>
                )}
              </div>

              {/* Delete for creator */}
              {isCreatorAdmin && userId === popupEvent.createdBy && (
                <div className="mt-5 flex gap-2 border-t border-[var(--ud-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(popupEvent.id)}
                    className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE EVENT MODAL ═══ */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-[var(--ud-bg-card)] shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between rounded-t-2xl bg-[#0C5C57] px-5 py-3.5 sm:rounded-t-2xl">
              <h3 className="text-sm font-semibold text-white">Create Event</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-white/60 transition hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--ud-text-secondary)]">Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ud-text-secondary)]">Date *</label>
                <input
                  type="date"
                  value={createFormDate}
                  onChange={(e) => setCreateFormDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ud-text-secondary)]">Start Time</label>
                <input
                  type="time"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ud-text-secondary)]">End Time</label>
                <input
                  type="time"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ud-text-secondary)]">Location</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ud-text-secondary)]">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-[var(--ud-border)] px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-[var(--ud-border)] py-2 text-sm font-semibold text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateEvent}
                  disabled={!createForm.title.trim()}
                  className="flex-1 rounded-lg bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>

    {/* ── Mobile FAB — opens create event modal ── */}
    {isCreatorAdmin && (
      <button
        type="button"
        onClick={() => openCreateForDate(today)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
        style={{ backgroundColor: "#0C5C57" }}
        aria-label="Create event"
      >
        <CalendarDays className="h-6 w-6 text-white" />
      </button>
    )}
    </>
  );
}
