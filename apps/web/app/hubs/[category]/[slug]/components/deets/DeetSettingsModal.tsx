"use client";

import { Calendar, Clock } from "lucide-react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, cn } from "../hubUtils";
import { DEET_VISIBILITIES, type DeetVisibility } from "@/lib/services/deets/deet-types";
import type { DeetSettingsState } from "./deetTypes";
import { buildLocalDateTime, localYmd, parseLocalDateTime } from "./composer/composerDatetime";
import { COMPOSER_INPUT } from "./composer/composerFieldClasses";
import { ComposerTime12hRow } from "./composer/ComposerTime12hRow";

const AUDIENCE_LABELS: Record<DeetVisibility, { label: string; description: string }> = {
  hub_default: {
    label: "Hub default",
    description: "Use this hub's usual visibility rules.",
  },
  members_only: {
    label: "Members only",
    description: "Signed-in members of this hub.",
  },
  admins_only: {
    label: "Admins & moderators",
    description: "Hub leadership roles only.",
  },
  everyone_with_access: {
    label: "Everyone with access",
    description: "Anyone who can open this hub (including guests if the hub allows).",
  },
};

function Toggle({
  checked,
  onToggle,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative h-7 w-12 rounded-full transition",
        disabled && "cursor-not-allowed opacity-50",
        checked ? "bg-[var(--ud-brand-primary)]" : "bg-slate-200"
      )}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
    </button>
  );
}

/** Inline deet behavior: conversation, pin, timing, audience. Values persist on publish in a `deet_options` attachment. */
export function DeetSettingsFields({
  settings,
  onChange,
  disabled,
}: {
  settings: DeetSettingsState;
  onChange: (next: DeetSettingsState) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--ud-border)] px-4 py-4">
        <h4 className="text-sm font-semibold text-[var(--ud-text-primary)]">Conversation & reactions</h4>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ud-text-muted)]">
          Control how people can respond. These choices are stored with your deet so the feed can honor them later.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--ud-text-primary)]">Allow comments</span>
            <Toggle
              checked={settings.commentsEnabled}
              disabled={disabled}
              onToggle={() => onChange({ ...settings, commentsEnabled: !settings.commentsEnabled })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--ud-text-primary)]">Allow reactions</span>
            <Toggle
              checked={settings.reactionsEnabled}
              disabled={disabled}
              onToggle={() => onChange({ ...settings, reactionsEnabled: !settings.reactionsEnabled })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--ud-border)] px-4 py-4">
        <h4 className="text-sm font-semibold text-[var(--ud-text-primary)]">Pin to top</h4>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ud-text-muted)]">
          Ask to keep this deet near the top of the hub feed. Final ordering may follow hub rules.
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-[var(--ud-text-primary)]">Pin this deet</span>
          <Toggle checked={settings.pinToTop} disabled={disabled} onToggle={() => onChange({ ...settings, pinToTop: !settings.pinToTop })} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--ud-border)] px-4 py-4">
        <h4 className="text-sm font-semibold text-[var(--ud-text-primary)]">Timing</h4>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ud-text-muted)]">
          Publish now or pick a time. Scheduled delivery will use this timestamp when that feature is enabled for your hub.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...settings, publishTiming: "now" })}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              settings.publishTiming === "now"
                ? "bg-[var(--ud-brand-primary)] text-white"
                : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
            )}
          >
            Publish now
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange({
                ...settings,
                publishTiming: "scheduled",
                scheduledAt: settings.scheduledAt?.trim() ? settings.scheduledAt : `${localYmd()}T12:00`,
              })
            }
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              settings.publishTiming === "scheduled"
                ? "bg-[var(--ud-brand-primary)] text-white"
                : "bg-[var(--ud-bg-subtle)] text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
            )}
          >
            Schedule
          </button>
        </div>
        {settings.publishTiming === "scheduled" ? (
          (() => {
            const { date: scheduleDate, time: scheduleTime } = parseLocalDateTime(settings.scheduledAt);
            return (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">
                    <Calendar className="h-3.5 w-3.5 text-[var(--ud-brand-primary)]" aria-hidden />
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange({ ...settings, scheduledAt: buildLocalDateTime(e.target.value, scheduleTime) })
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
                    value24={scheduleTime}
                    onChange24={(t24) => onChange({ ...settings, scheduledAt: buildLocalDateTime(scheduleDate, t24) })}
                  />
                </div>
              </div>
            );
          })()
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--ud-border)] px-4 py-4">
        <h4 className="text-sm font-semibold text-[var(--ud-text-primary)]">Audience</h4>
        <p className="mt-1 text-xs leading-relaxed text-[var(--ud-text-muted)]">
          Who should be able to see this deet once it is published? Enforcement will follow hub permissions.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DEET_VISIBILITIES.map((value) => {
            const opt = AUDIENCE_LABELS[value];
            return (
              <button
                key={value}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...settings, audience: value })}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left text-xs transition",
                  settings.audience === value
                    ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-light)]/40 text-[var(--ud-text-primary)]"
                    : "border-[var(--ud-border-subtle)] text-[var(--ud-text-secondary)] hover:border-[var(--ud-border)]"
                )}
              >
                <span className="block font-semibold text-[var(--ud-text-primary)]">{opt.label}</span>
                <span className="mt-0.5 block leading-snug text-[var(--ud-text-muted)]">{opt.description}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function DeetSettingsModal({
  settings,
  onChange,
  onCancel,
  onSave,
}: {
  settings: DeetSettingsState;
  onChange: (next: DeetSettingsState) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div>
      <DeetSettingsFields settings={settings} onChange={onChange} />

      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className={BUTTON_SECONDARY}>
          Cancel
        </button>
        <button type="button" onClick={onSave} className={BUTTON_PRIMARY}>
          OK
        </button>
      </div>
    </div>
  );
}
