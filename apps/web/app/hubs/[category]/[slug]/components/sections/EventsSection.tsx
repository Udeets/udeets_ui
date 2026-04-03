"use client";

import { useState, useMemo, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, X, Plus } from "lucide-react";
import { cn } from "../hubUtils";
import { listHubEvents } from "@/lib/services/events/list-events";
import { createEvent, updateEvent, deleteEvent } from "@/lib/services/events/create-event";
import { rsvpToEvent, getUserRsvp, getEventRsvpCounts } from "@/lib/services/events/event-rsvps";
import type { HubEvent } from "@/lib/services/events/event-types";

/* ── constants ───────────────────────────────────────────────────── */

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const THEME_COLORS: Record<string, string> = {
  Pooja: "#0C5C57", Temple: "#0C5C57", Church: "#6366f1", Food: "#f59e0b",
  Service: "#8b5cf6", Party: "#ec4899", Trek: "#22c55e", Voluntary: "#06b6d4",
  Cultural: "#f97316", Kids: "#a855f7", Sports: "#ef4444", Community: "#0C5C57",
};
function themeColor(t: string) { return THEME_COLORS[t] ?? "#0C5C57"; }

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

/* ── inline grid style ───────────────────────────────────────────── */
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

      // Load RSVPs and counts for each event
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
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth()); setSelectedDate(null);
  }

  function goToToday() {
    const n = new Date();
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth()); setSelectedDate(n);
  }

  const listEvents = useMemo(() => {
    if (selectedDate) return eventsByDate.get(dateToString(selectedDate)) ?? [];
    return events
      .filter((ev) => { const d = parseDateString(ev.eventDate); return d && d.getMonth() === viewMonth && d.getFullYear() === viewYear; })
      .sort((a, b) => (parseDateString(a.eventDate)?.getTime() ?? 0) - (parseDateString(b.eventDate)?.getTime() ?? 0));
  }, [selectedDate, eventsByDate, events, viewMonth, viewYear]);

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

    // Update user's RSVP
    const newRsvps = new Map(userRsvps);
    newRsvps.set(eventId, status);
    setUserRsvps(newRsvps);

    // Update counts
    const counts = await getEventRsvpCounts(eventId);
    const newCounts = new Map(rsvpCounts);
    newCounts.set(eventId, counts);
    setRsvpCounts(newCounts);
  }

  /* ── render ──────────────────────────────────────────────────── */

  if (loading) {
    return (
      <section className="w-full min-w-0 bg-white px-1 py-5">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">Loading events...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-w-0 bg-white">
      {/* ═══ TOP BAR — "Events" left, "Add Event" right ═══ */}
      <div className="flex items-center justify-between px-1 pb-5">
        <h2 className="text-lg font-semibold text-[#111111]">Events</h2>
        <button
          type="button"
          onClick={() => {
            setCreateFormDate(dateToString(today));
            setCreateForm({ title: "", description: "", startTime: "", endTime: "", location: "" });
            setShowCreateModal(true);
          }}
          className="rounded-full border border-[#0C5C57] px-4 py-1.5 text-xs font-semibold text-[#0C5C57] transition hover:bg-[#EAF6F3]"
        >
          Add Event
        </button>
      </div>

      {/* ═══ MONTH NAV — "Apr 2026 < > [Today]        📅" ═══ */}
      <div className="flex items-center gap-2 px-1 pb-4">
        <span className="text-xl font-bold tracking-tight text-[#111111]">
          {SHORT_MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="ml-1 flex h-6 w-6 items-center justify-center text-slate-400 transition hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-6 w-6 items-center justify-center text-slate-400 transition hover:text-slate-600"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={goToToday}
          className="ml-1 rounded border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Today
        </button>

        <span className="flex-1" />
        <CalendarDays className="h-4 w-4 text-slate-300" />
      </div>

      {/* ═══ CALENDAR TABLE — flat, no rounded corners ═══ */}
      <div className="select-none border-t border-l border-slate-200">
        {/* Day-of-week header row */}
        <div style={GRID7}>
          {DAY_HEADERS.map((d) => (
            <span
              key={d}
              className="border-b border-r border-slate-200 py-2 text-center text-[12px] font-normal text-slate-400"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Date rows */}
        {grid.map((row, ri) => (
          <div key={ri} style={GRID7}>
            {row.map((cell) => {
              const todayCell = isToday(cell.date);
              const selected = selectedDate && isSameDay(cell.date, selectedDate);
              const cellEvents = eventsOn(cell.date);

              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(selected ? null : cell.date)}
                  style={{ minHeight: 80 }}
                  className={cn(
                    "relative border-b border-r border-slate-200 p-1.5 text-left align-top transition",
                    todayCell && "ring-2 ring-inset ring-[#0C5C57]",
                    selected && !todayCell && "bg-[#F7FBFA]",
                    !selected && !todayCell && "hover:bg-slate-50/30"
                  )}
                >
                  {/* Date number — top-left */}
                  <span
                    className={cn(
                      "block text-[13px] leading-none",
                      !cell.inMonth
                        ? "text-slate-300"
                        : todayCell
                          ? "font-bold text-[#0C5C57]"
                          : "text-[#333]"
                    )}
                  >
                    {cell.date.getDate()}
                  </span>

                  {/* Event previews inside cell */}
                  {cellEvents.length > 0 && (
                    <div className="mt-1.5 space-y-0.5 overflow-hidden">
                      {cellEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} className="flex items-center gap-1">
                          <span
                            className="h-[5px] w-[5px] shrink-0 rounded-full"
                            style={{ backgroundColor: themeColor("Community") }}
                          />
                          <span className="truncate text-[10px] leading-tight text-slate-500">
                            {ev.title.length > 12 ? ev.title.slice(0, 12) + "…" : ev.title}
                          </span>
                        </div>
                      ))}
                      {cellEvents.length > 2 && (
                        <span className="block pl-2.5 text-[9px] text-slate-400">
                          +{cellEvents.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ═══ EVENT LIST — below calendar ═══ */}
      <div className="mt-6 px-1">
        {listEvents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CalendarDays className="h-8 w-8 text-slate-200" />
            <p className="mt-3 text-sm font-medium text-[#111111]">No events</p>
            <p className="mt-0.5 text-[13px] text-slate-400">
              {selectedDate ? "Nothing scheduled for this date." : "Plan the first event for your hub."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {listEvents.map((ev) => {
              const parsed = parseDateString(ev.eventDate);
              return (
                <button
                  key={ev.id}
                  id={ev.id}
                  type="button"
                  onClick={() => setPopupEvent(ev)}
                  className="flex w-full items-start gap-5 py-5 text-left transition hover:bg-slate-50/40"
                >
                  {/* Large date + full day name */}
                  {parsed && (
                    <div className="flex w-14 shrink-0 flex-col items-center">
                      <span className="text-[28px] font-bold leading-none text-[#111111]">
                        {String(parsed.getDate()).padStart(2, "0")}
                      </span>
                      <span className="mt-1 text-[11px] text-slate-400">
                        {FULL_DAY_NAMES[parsed.getDay()]}
                      </span>
                    </div>
                  )}

                  {/* Event details */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[15px] font-semibold text-[#111111]">{ev.title}</p>
                    {ev.startTime && (
                      <p className="mt-1 text-[13px] text-slate-500">
                        {ev.startTime}
                        {ev.endTime ? ` - ${ev.endTime}` : ""}
                      </p>
                    )}
                    {ev.location && <p className="text-[13px] text-slate-400">{ev.location}</p>}
                  </div>
                </button>
              );
            })}
          </div>
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
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Teal header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-[#0C5C57] px-5 py-3.5 sm:rounded-t-2xl">
              <h3 className="text-sm font-semibold text-white">{popupEvent.title}</h3>
              <button
                type="button"
                onClick={() => setPopupEvent(null)}
                className="text-white/60 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {popupEvent.description && (
                <p className="pb-4 text-sm text-slate-600">{popupEvent.description}</p>
              )}

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-[#111111]">
                    {parseDateString(popupEvent.eventDate)?.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
                {popupEvent.startTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-[#111111]">
                      {popupEvent.startTime}
                      {popupEvent.endTime ? ` - ${popupEvent.endTime}` : ""}
                    </span>
                  </div>
                )}
                {popupEvent.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-[#111111]">{popupEvent.location}</span>
                  </div>
                )}
              </div>

              {/* RSVP Section */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold text-slate-600">RSVP</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRsvp(popupEvent.id, "going")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition",
                      userRsvps.get(popupEvent.id) === "going"
                        ? "bg-green-100 text-green-700"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Going
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRsvp(popupEvent.id, "maybe")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition",
                      userRsvps.get(popupEvent.id) === "maybe"
                        ? "bg-yellow-100 text-yellow-700"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Maybe
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRsvp(popupEvent.id, "not_going")}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition",
                      userRsvps.get(popupEvent.id) === "not_going"
                        ? "bg-red-100 text-red-700"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    Not Going
                  </button>
                </div>

                {/* RSVP Counts */}
                {rsvpCounts.get(popupEvent.id) && (
                  <div className="mt-3 flex gap-4 text-xs text-slate-600">
                    <span>{rsvpCounts.get(popupEvent.id)!.going} Going</span>
                    <span>{rsvpCounts.get(popupEvent.id)!.maybe} Maybe</span>
                    <span>{rsvpCounts.get(popupEvent.id)!.notGoing} Not Going</span>
                  </div>
                )}
              </div>

              {/* Edit/Delete buttons for creator */}
              {isCreatorAdmin && userId === popupEvent.createdBy && (
                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
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
            className="relative z-10 w-full max-w-md rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-2xl bg-[#0C5C57] px-5 py-3.5 sm:rounded-t-2xl">
              <h3 className="text-sm font-semibold text-white">Create Event</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-white/60 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                  placeholder="Event title"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Date *</label>
                <input
                  type="date"
                  value={createFormDate}
                  onChange={(e) => setCreateFormDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Start Time</label>
                <input
                  type="time"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">End Time</label>
                <input
                  type="time"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Location</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                  placeholder="Event location"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#0C5C57] focus:outline-none"
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
  );
}
