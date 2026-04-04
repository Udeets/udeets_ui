"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";

const BTN_PRIMARY =
  "rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90";
const BTN_SECONDARY =
  "rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-4 py-2 text-xs font-semibold text-[var(--ud-text-primary)] transition hover:bg-[var(--ud-bg-subtle)]";
const INPUT =
  "w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-4 py-2.5 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-border-focus)] focus:ring-2 focus:ring-[var(--ud-brand-light)]";

/* ── Announcement ─────────────────────────────────────────────── */

export function AnnouncementChildContent({
  onAttach,
  onCancel,
}: {
  onAttach: (title: string, body: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ud-text-secondary)]">
        Create an announcement that will be pinned and highlighted for all hub members.
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Important Update" className={INPUT} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Details</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What do members need to know?"
          rows={3}
          className={`${INPUT} resize-none`}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancel</button>
        <button
          type="button"
          disabled={!title.trim()}
          onClick={() => onAttach(title.trim(), body.trim())}
          className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Add Announcement
        </button>
      </div>
    </div>
  );
}

/* ── Notice ───────────────────────────────────────────────────── */

export function NoticeChildContent({
  onAttach,
  onCancel,
}: {
  onAttach: (title: string, body: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ud-text-secondary)]">
        Post a notice to inform members about rules, reminders, or updates.
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Notice Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Parking Reminder" className={INPUT} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Description</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Provide details about this notice..."
          rows={3}
          className={`${INPUT} resize-none`}
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancel</button>
        <button
          type="button"
          disabled={!title.trim()}
          onClick={() => onAttach(title.trim(), body.trim())}
          className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Add Notice
        </button>
      </div>
    </div>
  );
}

/* ── Poll ─────────────────────────────────────────────────────── */

export function PollChildContent({
  onAttach,
  onCancel,
}: {
  onAttach: (question: string, options: string[]) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions(options.map((o, i) => (i === index ? value : o)));
  };

  const validOptions = options.filter((o) => o.trim());
  const canSubmit = question.trim() && validOptions.length >= 2;

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ud-text-secondary)]">
        Ask your community a question and let them vote.
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Question</label>
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to ask?" className={INPUT} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Options</label>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className={INPUT}
              />
              {options.length > 2 ? (
                <button type="button" onClick={() => removeOption(i)} className="shrink-0 rounded-full p-2 text-[var(--ud-text-muted)] transition hover:bg-rose-50 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {options.length < 6 ? (
          <button type="button" onClick={addOption} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)] transition hover:opacity-80">
            <Plus className="h-4 w-4" />
            Add option
          </button>
        ) : null}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancel</button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onAttach(question.trim(), validOptions)}
          className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Add Poll
        </button>
      </div>
    </div>
  );
}

/* ── Event ────────────────────────────────────────────────────── */

export function EventChildContent({
  onAttach,
  onCancel,
}: {
  onAttach: (title: string, date: string, time: string, location: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ud-text-secondary)]">
        Add an event with date, time, and location details.
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Event Name</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Community Meetup" className={INPUT} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={INPUT} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Location (optional)</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Community Hall, Main St" className={INPUT} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancel</button>
        <button
          type="button"
          disabled={!title.trim() || !date}
          onClick={() => onAttach(title.trim(), date, time, location.trim())}
          className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Add Event
        </button>
      </div>
    </div>
  );
}

/* ── Check-in ─────────────────────────────────────────────────── */

type NearbyPlace = {
  name: string;
  address: string;
};

export function CheckinChildContent({
  onAttach,
  onCancel,
}: {
  onAttach: (placeName: string, address: string) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "denied" | "error">("idle");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [manualName, setManualName] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        // Use reverse geocoding via Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();

          // Also search nearby places
          const nearbyRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=*&lat=${latitude}&lon=${longitude}&limit=8&bounded=1&viewbox=${longitude - 0.005},${latitude + 0.005},${longitude + 0.005},${latitude - 0.005}`
          );
          const nearbyData = await nearbyRes.json();

          const currentPlace: NearbyPlace = {
            name: data.name || data.address?.road || "Current Location",
            address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          };

          const nearby: NearbyPlace[] = nearbyData
            .filter((p: { display_name: string; name?: string }) => p.name)
            .map((p: { display_name: string; name: string }) => ({
              name: p.name,
              address: p.display_name,
            }));

          // Deduplicate
          const seen = new Set<string>();
          const allPlaces = [currentPlace, ...nearby].filter((p) => {
            if (seen.has(p.name)) return false;
            seen.add(p.name);
            return true;
          });

          setPlaces(allPlaces);
          setStatus("loaded");
        } catch {
          // Fallback to just coordinates
          setPlaces([{
            name: "Current Location",
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }]);
          setStatus("loaded");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <div className="space-y-4">
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--ud-brand-primary)]" />
          <p className="text-sm text-[var(--ud-text-secondary)]">Finding places near you...</p>
        </div>
      ) : status === "denied" ? (
        <div className="rounded-xl bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-800">Location access was denied</p>
          <p className="mt-1 text-xs text-amber-600">Please enable location permissions in your browser settings, or enter a place manually below.</p>
          <button type="button" onClick={() => setShowManual(true)} className="mt-3 text-sm font-medium text-[var(--ud-brand-primary)] hover:underline">
            Enter manually
          </button>
        </div>
      ) : status === "error" ? (
        <div className="rounded-xl bg-rose-50 p-4 text-center">
          <p className="text-sm font-medium text-rose-800">Could not get your location</p>
          <div className="mt-3 flex justify-center gap-3">
            <button type="button" onClick={requestLocation} className="text-sm font-medium text-[var(--ud-brand-primary)] hover:underline">Try again</button>
            <button type="button" onClick={() => setShowManual(true)} className="text-sm font-medium text-[var(--ud-text-secondary)] hover:underline">Enter manually</button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--ud-text-secondary)]">Select a place near you, or enter one manually.</p>
          <div className="max-h-[240px] space-y-1.5 overflow-y-auto">
            {places.map((place, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedPlace(place); setShowManual(false); }}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  selectedPlace?.name === place.name
                    ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-light)]"
                    : "border-[var(--ud-border-subtle)] hover:border-[var(--ud-border)] hover:bg-[var(--ud-bg-subtle)]"
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ud-brand-primary)]" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ud-text-primary)]">{place.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--ud-text-muted)]">{place.address}</p>
                </div>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setShowManual(true); setSelectedPlace(null); }} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)] transition hover:opacity-80">
            <Plus className="h-4 w-4" />
            Enter place manually
          </button>
        </>
      )}

      {showManual ? (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Place Name</label>
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="e.g. Central Park"
            className={INPUT}
            autoFocus
          />
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className={BTN_SECONDARY}>Cancel</button>
        <button
          type="button"
          disabled={!selectedPlace && !manualName.trim()}
          onClick={() => {
            if (manualName.trim()) {
              onAttach(manualName.trim(), coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "");
            } else if (selectedPlace) {
              onAttach(selectedPlace.name, selectedPlace.address);
            }
          }}
          className={`${BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Check In
        </button>
      </div>
    </div>
  );
}
