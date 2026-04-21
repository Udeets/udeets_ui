"use client";

import { useMemo } from "react";
import { ComposerMenuSelect, type ComposerMenuSelectOption } from "./ComposerMenuSelect";
import { normalizeEventTimeTo24h, parseTime24ToParts, partsToTime24, type AmPm } from "./composerTimeFormat";

const HOUR_OPTIONS: ComposerMenuSelectOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MINUTE_OPTIONS: ComposerMenuSelectOption[] = Array.from({ length: 60 }, (_, i) => {
  const v = String(i).padStart(2, "0");
  return { value: v, label: v };
});

const AMPM_OPTIONS: ComposerMenuSelectOption[] = [
  { value: "AM", label: "AM" },
  { value: "PM", label: "PM" },
];

const NONE = "__none__";
const OPTIONAL_SENTINEL: ComposerMenuSelectOption = { value: NONE, label: "—" };

type Props = {
  /** Stored as `HH:mm` (24h) or empty when optional and unset. */
  value24: string;
  onChange24: (hhmm: string) => void;
  disabled?: boolean;
  /** Event time can be omitted; shows a single “—” hour control until an hour is chosen. */
  optionalTime?: boolean;
};

/**
 * Hub-style menus: hour (1–12), minute (00–59), AM/PM — same interaction model as the feed sort menu.
 * Values round-trip as `HH:mm` for payloads and APIs.
 */
export function ComposerTime12hRow({ value24, onChange24, disabled, optionalTime = false }: Props) {
  const normalized = normalizeEventTimeTo24h(value24);
  const emptyOptional = optionalTime && !normalized;

  if (emptyOptional) {
    return (
      <ComposerMenuSelect
        disabled={disabled}
        placeholder="Time (optional)"
        value={NONE}
        options={[OPTIONAL_SENTINEL, ...HOUR_OPTIONS]}
        onChange={(v) => {
          if (!v || v === NONE) onChange24("");
          else onChange24(partsToTime24(parseInt(v, 10), "00", "AM"));
        }}
      />
    );
  }

  const { hourStr, minuteStr, apStr } = useMemo(() => {
    const base = normalized || "12:00";
    const p = parseTime24ToParts(base);
    return {
      hourStr: String(p.hour12),
      minuteStr: p.minute,
      apStr: p.ampm,
    };
  }, [normalized]);

  const hourOptions = useMemo(() => (optionalTime ? [OPTIONAL_SENTINEL, ...HOUR_OPTIONS] : HOUR_OPTIONS), [optionalTime]);

  const onHour = (v: string) => {
    if (optionalTime && v === NONE) {
      onChange24("");
      return;
    }
    onChange24(partsToTime24(parseInt(v, 10), minuteStr, apStr as AmPm));
  };

  const onMinute = (v: string) => {
    onChange24(partsToTime24(parseInt(hourStr, 10), v, apStr as AmPm));
  };

  const onAp = (v: string) => {
    onChange24(partsToTime24(parseInt(hourStr, 10), minuteStr, v === "PM" ? "PM" : "AM"));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <ComposerMenuSelect
        value={hourStr}
        disabled={disabled}
        placeholder="Hr"
        menuMinWidthPx={72}
        className="min-w-0"
        options={hourOptions}
        onChange={onHour}
      />
      <ComposerMenuSelect
        value={minuteStr}
        disabled={disabled}
        placeholder="Min"
        menuMinWidthPx={72}
        className="min-w-0"
        options={MINUTE_OPTIONS}
        onChange={onMinute}
      />
      <ComposerMenuSelect
        value={apStr}
        disabled={disabled}
        placeholder="—"
        menuMinWidthPx={76}
        className="min-w-0"
        options={AMPM_OPTIONS}
        onChange={onAp}
      />
    </div>
  );
}
