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

const TOGGLE =
  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200";
const TOGGLE_KNOB =
  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200";
const SELECT =
  "rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-3 py-1.5 text-sm text-[var(--ud-text-primary)] outline-none transition focus:border-[var(--ud-border-focus)]";

const SHOW_RESULTS_OPTIONS = [
  { value: "always", label: "Always view" },
  { value: "after_voting", label: "View after voting" },
  { value: "after_closed", label: "View after poll is closed" },
  { value: "private", label: "Private" },
] as const;

const SORT_OPTIONS = [
  { value: "option_no", label: "By option no." },
  { value: "votes", label: "By votes" },
] as const;

type PollSettings = import("./deetTypes").PollSettings;

export function PollChildContent({
  onAttach,
  onCancel,
}: {
  onAttach: (question: string, options: string[], settings: PollSettings) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [allowAnyoneToAdd, setAllowAnyoneToAdd] = useState(false);
  const [allowMultiSelect, setAllowMultiSelect] = useState(false);
  const [multiSelectLimit, setMultiSelectLimit] = useState<number | null>(null);
  const [allowSecretVoting, setAllowSecretVoting] = useState(false);
  const [deadlineEnabled, setDeadlineEnabled] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [showResults, setShowResults] = useState<PollSettings["showResults"]>("always");
  const [sortBy, setSortBy] = useState<PollSettings["sortBy"]>("option_no");

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
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
      {/* Question */}
      <div>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question"
          className={`${INPUT} text-base font-medium`}
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] text-xs font-semibold text-[var(--ud-text-muted)]">{i + 1}</span>
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder="Option"
              className={`${INPUT} flex-1`}
            />
            {options.length > 2 ? (
              <button type="button" onClick={() => removeOption(i)} className="shrink-0 rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-rose-50 hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
        {options.length < 10 ? (
          <button type="button" onClick={addOption} className="inline-flex items-center gap-1.5 pl-8 text-sm font-medium text-[var(--ud-brand-primary)] transition hover:opacity-80">
            <Plus className="h-4 w-4" />
            Option
          </button>
        ) : null}
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--ud-border-subtle)]" />

      {/* Toggle settings */}
      <div className="space-y-3">
        {/* Allow anyone to add */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--ud-text-primary)]">Allow anyone to add</span>
          <button
            type="button"
            role="switch"
            aria-checked={allowAnyoneToAdd}
            onClick={() => setAllowAnyoneToAdd(!allowAnyoneToAdd)}
            className={`${TOGGLE} ${allowAnyoneToAdd ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
          >
            <span className={`${TOGGLE_KNOB} ${allowAnyoneToAdd ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Allow multi-select */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--ud-text-primary)]">Allow multi-select</span>
          <div className="flex items-center gap-2">
            {allowMultiSelect && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--ud-text-muted)]">Limit</span>
                <select
                  value={multiSelectLimit ?? ""}
                  onChange={(e) => setMultiSelectLimit(e.target.value ? Number(e.target.value) : null)}
                  className={`${SELECT} min-w-[100px]`}
                >
                  <option value="">Unlimited</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={allowMultiSelect}
              onClick={() => setAllowMultiSelect(!allowMultiSelect)}
              className={`${TOGGLE} ${allowMultiSelect ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
            >
              <span className={`${TOGGLE_KNOB} ${allowMultiSelect ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Allow secret voting */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--ud-text-primary)]">Allow secret voting</span>
          <button
            type="button"
            role="switch"
            aria-checked={allowSecretVoting}
            onClick={() => setAllowSecretVoting(!allowSecretVoting)}
            className={`${TOGGLE} ${allowSecretVoting ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
          >
            <span className={`${TOGGLE_KNOB} ${allowSecretVoting ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--ud-text-primary)]">Deadline</span>
          <div className="flex items-center gap-2">
            {deadlineEnabled && (
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`${SELECT} text-xs`}
              />
            )}
            <button
              type="button"
              role="switch"
              aria-checked={deadlineEnabled}
              onClick={() => setDeadlineEnabled(!deadlineEnabled)}
              className={`${TOGGLE} ${deadlineEnabled ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
            >
              <span className={`${TOGGLE_KNOB} ${deadlineEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--ud-border-subtle)]" />

      {/* Dropdowns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--ud-text-primary)]">Show Results</span>
          <select
            value={showResults}
            onChange={(e) => setShowResults(e.target.value as PollSettings["showResults"])}
            className={SELECT}
          >
            {SHOW_RESULTS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--ud-text-primary)]">Sort poll options</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as PollSettings["sortBy"])}
            className={SELECT}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attach button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            onAttach(question.trim(), validOptions, {
              allowAnyoneToAdd,
              allowMultiSelect,
              multiSelectLimit: allowMultiSelect ? multiSelectLimit : null,
              allowSecretVoting,
              deadline: deadlineEnabled && deadline ? deadline : null,
              showResults,
              sortBy,
            })
          }
          className={`${BTN_PRIMARY} w-full max-w-[200px] py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Attach
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
