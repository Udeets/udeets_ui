"use client";

import { useCallback, useState } from "react";
import { Calendar, ChevronDown, Clock, DollarSign, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import type { PollSettings } from "../deetTypes";
import type { ComposerContentKind, ComposerTypePayload } from "./composerTypes";
import { cn } from "../../hubUtils";
import { COMPOSER_INPUT, COMPOSER_TOGGLE, COMPOSER_TOGGLE_KNOB } from "./composerFieldClasses";
import { buildLocalDateTime, localYmd, parseLocalDateTime } from "./composerDatetime";
import { ComposerMenuSelect, type ComposerMenuSelectOption } from "./ComposerMenuSelect";
import { ComposerTime12hRow } from "./ComposerTime12hRow";

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

const POLL_MULTI_LIMIT_OPTIONS: ComposerMenuSelectOption[] = [
  { value: "", label: "Unlimited" },
  { value: "2", label: "2 choices" },
  { value: "3", label: "3 choices" },
  { value: "4", label: "4 choices" },
  { value: "5", label: "5 choices" },
];

const ALERT_LEVELS = [
  { value: "info", label: "Info", color: "bg-blue-100 text-blue-700" },
  { value: "warning", label: "Warning", color: "bg-amber-100 text-amber-700" },
  { value: "urgent", label: "Urgent", color: "bg-rose-100 text-rose-700" },
] as const;

const JOB_KINDS = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
] as const;

type NearbyPlace = { name: string; address: string };

function CheckinFields({
  placeName,
  address,
  onChange,
  disabled,
  variant = "checkin",
}: {
  placeName: string;
  address: string;
  onChange: (next: { placeName: string; address: string }) => void;
  disabled?: boolean;
  variant?: "checkin" | "post";
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
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
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
          const seen = new Set<string>();
          const allPlaces = [currentPlace, ...nearby].filter((p) => {
            if (seen.has(p.name)) return false;
            seen.add(p.name);
            return true;
          });
          setPlaces(allPlaces);
          setStatus("loaded");
        } catch {
          setPlaces([
            {
              name: "Current Location",
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            },
          ]);
          setStatus("loaded");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setStatus("denied");
        else setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const applySelection = (name: string, addr: string) => {
    onChange({ placeName: name, address: addr });
  };

  const intro =
    variant === "post"
      ? "Tag this post with a place — same idea as adding photos. Optional."
      : "Where are you checking in?";

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--ud-text-secondary)]">{intro}</p>
      {status === "idle" ? (
        <div className="rounded-xl border border-dashed border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-4 py-4 text-center">
          <p className="text-sm text-[var(--ud-text-secondary)]">Use your device location to pick a nearby place, or enter one manually.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => void requestLocation()}
              className="rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Use my location
            </button>
          </div>
        </div>
      ) : null}
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--ud-brand-primary)]" />
          <p className="text-sm text-[var(--ud-text-secondary)]">Finding places near you...</p>
        </div>
      ) : status === "denied" ? (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Location denied — enter a place manually below.
        </div>
      ) : status === "error" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void requestLocation()} className="text-sm font-medium text-[var(--ud-brand-primary)]">
            Try location again
          </button>
        </div>
      ) : status === "loaded" ? (
        places.length > 0 ? (
          <div className="max-h-[200px] space-y-1.5 overflow-y-auto">
            {places.map((place, i) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectedPlace(place);
                  setShowManual(false);
                  applySelection(place.name, place.address);
                }}
                className={`flex w-full items-start gap-3 rounded-xl border p-2.5 text-left text-sm transition ${
                  selectedPlace?.name === place.name
                    ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-light)]"
                    : "border-[var(--ud-border-subtle)] hover:border-[var(--ud-border)]"
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ud-brand-primary)]" />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--ud-text-primary)]">{place.name}</p>
                  <p className="truncate text-xs text-[var(--ud-text-muted)]">{place.address}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ud-text-muted)]">No nearby places found. Enter a place manually below.</p>
        )
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setShowManual(true);
          setSelectedPlace(null);
        }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)]"
      >
        <Plus className="h-4 w-4" />
        Enter manually
      </button>
      {showManual ? (
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Place name</label>
          <input
            value={manualName || placeName}
            onChange={(e) => {
              const v = e.target.value;
              setManualName(v);
              onChange({ placeName: v, address: coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : address });
            }}
            placeholder="e.g. Central Park"
            disabled={disabled}
            className={COMPOSER_INPUT}
          />
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Address (optional)</label>
          <input
            value={address}
            onChange={(e) => onChange({ placeName: manualName || placeName, address: e.target.value })}
            placeholder="Address or notes"
            disabled={disabled}
            className={COMPOSER_INPUT}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ComposerInlineExtensions({
  kind,
  payload,
  onPayloadChange,
  disabled,
}: {
  kind: ComposerContentKind;
  payload: ComposerTypePayload;
  onPayloadChange: (next: ComposerTypePayload) => void;
  disabled?: boolean;
}) {
  if (kind === "post") {
    const p = payload as import("./composerTypes").ComposerCheckinExtension;
    const filled = Boolean(p.placeName.trim() || p.address.trim());
    return (
      <details
        className={cn(
          "group rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-2 transition-shadow duration-200 open:shadow-sm",
          filled && "border-[var(--ud-brand-primary)]/25 bg-[var(--ud-brand-light)]/20"
        )}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-medium text-[var(--ud-text-secondary)] [&::-webkit-details-marker]:hidden">
          <span>Add A Place (Optional)</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)] transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="mt-2 border-t border-[var(--ud-border-subtle)] pt-3">
          <CheckinFields variant="post" placeName={p.placeName} address={p.address} disabled={disabled} onChange={(next) => onPayloadChange({ ...p, ...next })} />
        </div>
      </details>
    );
  }

  if (kind === "announcement") {
    return (
      <div className="mt-4 space-y-3 border-t border-[var(--ud-border-subtle)] pt-4">
        <p className="text-sm text-[var(--ud-text-secondary)]">
          Announcements are highlighted for hub members. Use the title and body above for your message. To pin to the top or change audience, open{" "}
          <strong className="font-semibold text-[var(--ud-text-primary)]">Deet settings</strong> from the toolbar below.
        </p>
      </div>
    );
  }

  if (kind === "notice") {
    return (
      <p className="mt-4 border-t border-[var(--ud-border-subtle)] pt-4 text-sm text-[var(--ud-text-secondary)]">
        Use the title and body above for your notice.
      </p>
    );
  }

  if (kind === "poll") {
    const p = payload as import("./composerTypes").ComposerPollExtension;
    const setOptions = (options: string[]) => onPayloadChange({ ...p, options });
    const setPoll = (patch: Partial<PollSettings>) =>
      onPayloadChange({ ...p, pollSettings: { ...p.pollSettings, ...patch } });

    const addOption = () => {
      if (p.options.length < 10) setOptions([...p.options, ""]);
    };
    const removeOption = (index: number) => {
      if (p.options.length > 2) setOptions(p.options.filter((_, i) => i !== index));
    };
    const updateOption = (index: number, value: string) => {
      setOptions(p.options.map((o, i) => (i === index ? value : o)));
    };

    const ps = p.pollSettings;
    const { date: deadlineDate, time: deadlineTime } = parseLocalDateTime(p.deadlineInput);
    return (
      <div className="space-y-4">
        <p className="text-sm text-[var(--ud-text-muted)]">Answer choices (your question is the title field above)</p>
        <div className="space-y-2">
          {p.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] text-xs font-semibold text-[var(--ud-text-muted)]">
                {i + 1}
              </span>
              <input
                value={opt}
                disabled={disabled}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder="Option"
                className={`${COMPOSER_INPUT} flex-1`}
              />
              {p.options.length > 2 ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeOption(i)}
                  className="shrink-0 rounded-full p-1.5 text-[var(--ud-text-muted)] hover:bg-rose-50 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          ))}
          {p.options.length < 10 ? (
            <button type="button" disabled={disabled} onClick={addOption} className="inline-flex items-center gap-1.5 pl-8 text-sm font-medium text-[var(--ud-brand-primary)]">
              <Plus className="h-4 w-4" />
              Option
            </button>
          ) : null}
        </div>

        <details
          className={cn(
            "group rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-2 transition-shadow duration-200 open:shadow-sm"
          )}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-1 text-sm font-semibold tracking-tight text-[var(--ud-text-primary)] [&::-webkit-details-marker]:hidden">
            <span>Advanced Poll Options</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)] transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="mt-3 space-y-4 border-t border-[var(--ud-border-subtle)] pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--ud-text-primary)]">Allow anyone to add</span>
              <button
                type="button"
                role="switch"
                disabled={disabled}
                aria-checked={ps.allowAnyoneToAdd}
                onClick={() => setPoll({ allowAnyoneToAdd: !ps.allowAnyoneToAdd })}
                className={`${COMPOSER_TOGGLE} ${ps.allowAnyoneToAdd ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
              >
                <span className={`${COMPOSER_TOGGLE_KNOB} ${ps.allowAnyoneToAdd ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="text-sm font-medium text-[var(--ud-text-primary)]">Allow multi-select</span>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {ps.allowMultiSelect ? (
                  <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:max-w-[11rem]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Limit</span>
                    <ComposerMenuSelect
                      value={ps.multiSelectLimit != null ? String(ps.multiSelectLimit) : ""}
                      disabled={disabled}
                      placeholder="Limit"
                      options={POLL_MULTI_LIMIT_OPTIONS}
                      onChange={(v) => setPoll({ multiSelectLimit: v ? Number(v) : null })}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  role="switch"
                  disabled={disabled}
                  aria-checked={ps.allowMultiSelect}
                  onClick={() => setPoll({ allowMultiSelect: !ps.allowMultiSelect })}
                  className={`${COMPOSER_TOGGLE} shrink-0 ${ps.allowMultiSelect ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
                >
                  <span className={`${COMPOSER_TOGGLE_KNOB} ${ps.allowMultiSelect ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--ud-text-primary)]">Secret voting</span>
              <button
                type="button"
                role="switch"
                disabled={disabled}
                aria-checked={ps.allowSecretVoting}
                onClick={() => setPoll({ allowSecretVoting: !ps.allowSecretVoting })}
                className={`${COMPOSER_TOGGLE} ${ps.allowSecretVoting ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
              >
                <span className={`${COMPOSER_TOGGLE_KNOB} ${ps.allowSecretVoting ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-[var(--ud-text-primary)]">Deadline</span>
                <button
                  type="button"
                  role="switch"
                  disabled={disabled}
                  aria-checked={p.deadlineEnabled}
                  onClick={() => {
                    const on = !p.deadlineEnabled;
                    if (on && !p.deadlineInput.trim()) {
                      onPayloadChange({ ...p, deadlineEnabled: true, deadlineInput: `${localYmd()}T23:59` });
                    } else {
                      onPayloadChange({ ...p, deadlineEnabled: on });
                    }
                  }}
                  className={`${COMPOSER_TOGGLE} shrink-0 self-end sm:self-center ${p.deadlineEnabled ? "bg-[var(--ud-brand-primary)]" : "bg-gray-300"}`}
                >
                  <span className={`${COMPOSER_TOGGLE_KNOB} ${p.deadlineEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
              {p.deadlineEnabled ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">
                      <Calendar className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" aria-hidden />
                      Date
                    </label>
                    <input
                      type="date"
                      value={deadlineDate}
                      disabled={disabled}
                      onChange={(e) =>
                        onPayloadChange({ ...p, deadlineInput: buildLocalDateTime(e.target.value, deadlineTime) })
                      }
                      className={COMPOSER_INPUT}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">
                      <Clock className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" aria-hidden />
                      Time
                    </label>
                    <ComposerTime12hRow
                      disabled={disabled}
                      value24={deadlineTime}
                      onChange24={(t24) => onPayloadChange({ ...p, deadlineInput: buildLocalDateTime(deadlineDate, t24) })}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-4 border-t border-[var(--ud-border-subtle)] pt-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="shrink-0 text-sm font-medium text-[var(--ud-text-primary)]">Show results</span>
                <ComposerMenuSelect
                  className="w-full sm:max-w-[min(100%,16rem)] sm:flex-1"
                  value={ps.showResults ?? "always"}
                  disabled={disabled}
                  options={[...SHOW_RESULTS_OPTIONS]}
                  onChange={(v) => setPoll({ showResults: v as PollSettings["showResults"] })}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="shrink-0 text-sm font-medium text-[var(--ud-text-primary)]">Sort options</span>
                <ComposerMenuSelect
                  className="w-full sm:max-w-[min(100%,14rem)] sm:flex-1"
                  value={ps.sortBy ?? "option_no"}
                  disabled={disabled}
                  options={[...SORT_OPTIONS]}
                  onChange={(v) => setPoll({ sortBy: v as PollSettings["sortBy"] })}
                />
              </div>
            </div>
          </div>
        </details>
      </div>
    );
  }

  if (kind === "event") {
    const e = payload as import("./composerTypes").ComposerEventExtension;
    return (
      <div className="mt-4 space-y-4 border-t border-[var(--ud-border-subtle)] pt-4">
        <p className="text-sm text-[var(--ud-text-secondary)]">Event name is the title field above; add details in the body.</p>
        <div className="rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-3 shadow-sm sm:p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">When</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">
                <Calendar className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" aria-hidden />
                Date
              </label>
              <input
                type="date"
                value={e.date}
                disabled={disabled}
                onChange={(ev) => onPayloadChange({ ...e, date: ev.target.value })}
                className={COMPOSER_INPUT}
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">
                <Clock className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" aria-hidden />
                Time
              </label>
              <ComposerTime12hRow
                optionalTime
                disabled={disabled}
                value24={e.time}
                onChange24={(t) => onPayloadChange({ ...e, time: t })}
              />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Location (optional)</label>
          <input
            value={e.location}
            disabled={disabled}
            onChange={(ev) => onPayloadChange({ ...e, location: ev.target.value })}
            placeholder="e.g. Community Hall"
            className={COMPOSER_INPUT}
          />
        </div>
      </div>
    );
  }

  if (kind === "alert") {
    const a = payload as import("./composerTypes").ComposerAlertExtension;
    return (
      <div className="mt-4 space-y-3 border-t border-[var(--ud-border-subtle)] pt-4">
        <p className="text-sm text-[var(--ud-text-secondary)]">Severity applies to the alert; use the title and body above.</p>
        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Severity</span>
          <div className="flex flex-wrap gap-2">
            {ALERT_LEVELS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => onPayloadChange({ ...a, level: opt.value as typeof a.level })}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  a.level === opt.value ? opt.color : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-muted)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "survey") {
    const s = payload as import("./composerTypes").ComposerSurveyExtension;
    const setQuestions = (questions: typeof s.questions) => onPayloadChange({ ...s, questions });

    const updateQuestion = (qIndex: number, value: string) => {
      setQuestions(s.questions.map((q, i) => (i === qIndex ? { ...q, question: value } : q)));
    };
    const updateOption = (qIndex: number, oIndex: number, value: string) => {
      setQuestions(
        s.questions.map((q, i) =>
          i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q
        )
      );
    };
    const addOption = (qIndex: number) => {
      setQuestions(
        s.questions.map((q, i) => (i === qIndex && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q))
      );
    };
    const removeOption = (qIndex: number, oIndex: number) => {
      setQuestions(
        s.questions.map((q, i) =>
          i === qIndex && q.options.length > 2 ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q
        )
      );
    };
    const addQuestion = () => {
      if (s.questions.length < 10) setQuestions([...s.questions, { question: "", options: ["", ""] }]);
    };
    const removeQuestion = (qIndex: number) => {
      if (s.questions.length > 1) setQuestions(s.questions.filter((_, i) => i !== qIndex));
    };

    return (
      <div className="mt-4 max-h-[min(360px,50vh)] space-y-4 overflow-y-auto border-t border-[var(--ud-border-subtle)] pt-4">
        <p className="text-sm text-[var(--ud-text-muted)]">Survey title is above; add questions below.</p>
        {s.questions.map((q, qIndex) => (
          <div key={qIndex} className="rounded-xl border border-[var(--ud-border-subtle)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ud-text-muted)]">Question {qIndex + 1}</span>
              {s.questions.length > 1 ? (
                <button type="button" disabled={disabled} onClick={() => removeQuestion(qIndex)} className="rounded-full p-1 text-[var(--ud-text-muted)] hover:bg-rose-50 hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <input
              value={q.question}
              disabled={disabled}
              onChange={(e) => updateQuestion(qIndex, e.target.value)}
              placeholder="Ask a question..."
              className={`${COMPOSER_INPUT} mb-2`}
            />
            <div className="space-y-2">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--ud-border)] text-[10px] font-semibold text-[var(--ud-text-muted)]">
                    {oIndex + 1}
                  </span>
                  <input
                    value={opt}
                    disabled={disabled}
                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                    placeholder="Option"
                    className={`${COMPOSER_INPUT} flex-1 py-2 text-sm`}
                  />
                  {q.options.length > 2 ? (
                    <button type="button" disabled={disabled} onClick={() => removeOption(qIndex, oIndex)} className="shrink-0 rounded-full p-1 text-[var(--ud-text-muted)] hover:text-rose-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              ))}
              {q.options.length < 6 ? (
                <button type="button" disabled={disabled} onClick={() => addOption(qIndex)} className="inline-flex items-center gap-1 pl-7 text-xs font-medium text-[var(--ud-brand-primary)]">
                  <Plus className="h-3.5 w-3.5" />
                  Add option
                </button>
              ) : null}
            </div>
          </div>
        ))}
        {s.questions.length < 10 ? (
          <button type="button" disabled={disabled} onClick={addQuestion} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ud-brand-primary)]">
            <Plus className="h-4 w-4" />
            Add question
          </button>
        ) : null}
      </div>
    );
  }

  if (kind === "payment") {
    const pay = payload as import("./composerTypes").ComposerPaymentExtension;
    return (
      <div className="mt-4 space-y-3 border-t border-[var(--ud-border-subtle)] pt-4">
        <p className="text-sm text-[var(--ud-text-secondary)]">
          Use this for a fundraiser or donation drive. Give it a clear title and add how to contribute (and any story behind it) in the body above if you like.
        </p>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Goal amount ($)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ud-text-muted)]" />
            <input
              type="number"
              min="0"
              step="0.01"
              value={pay.amount}
              disabled={disabled}
              onChange={(e) => onPayloadChange({ ...pay, amount: e.target.value })}
              placeholder="0.00"
              className={`${COMPOSER_INPUT} pl-9`}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">How to pay / details (optional)</label>
          <textarea
            value={pay.paymentNote}
            disabled={disabled}
            onChange={(e) => onPayloadChange({ ...pay, paymentNote: e.target.value })}
            rows={2}
            placeholder="e.g. Link, Venmo handle, deadline, what the funds support"
            className={`${COMPOSER_INPUT} resize-none`}
          />
        </div>
      </div>
    );
  }

  if (kind === "jobs") {
    const j = payload as import("./composerTypes").ComposerJobsExtension;
    return (
      <div className="mt-4 space-y-3 border-t border-[var(--ud-border-subtle)] pt-4">
        <p className="text-sm text-[var(--ud-text-secondary)]">Job title is above; describe the role below.</p>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Roles &amp; responsibilities</label>
          <textarea
            value={j.rolesAndResponsibilities}
            disabled={disabled}
            onChange={(e) => onPayloadChange({ ...j, rolesAndResponsibilities: e.target.value })}
            rows={3}
            className={`${COMPOSER_INPUT} resize-none`}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Pay</label>
            <input
              value={j.pay}
              disabled={disabled}
              onChange={(e) => onPayloadChange({ ...j, pay: e.target.value })}
              placeholder="e.g. $25/hr"
              className={COMPOSER_INPUT}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Type</label>
            <ComposerMenuSelect
              value={j.kind}
              disabled={disabled}
              options={[...JOB_KINDS]}
              onChange={(v) => onPayloadChange({ ...j, kind: v })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Timings</label>
            <input
              value={j.timings}
              disabled={disabled}
              onChange={(e) => onPayloadChange({ ...j, timings: e.target.value })}
              placeholder="e.g. 9–5"
              className={COMPOSER_INPUT}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">Days / week</label>
            <input
              value={j.daysPerWeek}
              disabled={disabled}
              onChange={(e) => onPayloadChange({ ...j, daysPerWeek: e.target.value })}
              placeholder="e.g. 5"
              className={COMPOSER_INPUT}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
