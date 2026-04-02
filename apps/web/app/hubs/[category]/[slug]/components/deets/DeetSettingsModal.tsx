"use client";

import { BUTTON_PRIMARY, BUTTON_SECONDARY, cn } from "../hubUtils";
import type { DeetPostType, DeetSettingsState } from "./deetTypes";

const POST_TYPE_OPTIONS: Array<{ value: DeetPostType; label: string; description: string }> = [
  { value: "post", label: "Post", description: "General update" },
  { value: "notice", label: "Notice", description: "Official announcement" },
  { value: "news", label: "News", description: "News update" },
  { value: "deal", label: "Deal", description: "Discount or offer" },
  { value: "hazard", label: "Hazard", description: "Safety warning" },
  { value: "alert", label: "Alert", description: "Urgent notice" },
];

function Toggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn("relative h-7 w-12 rounded-full transition", checked ? "bg-[#0C5C57]" : "bg-slate-200")}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
    </button>
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
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 px-4 py-4">
          <span className="mb-2 block text-sm font-medium text-[#111111]">Post Type</span>
          <div className="flex flex-wrap gap-2">
            {POST_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...settings, postType: opt.value, noticeEnabled: opt.value === "notice" })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  settings.postType === opt.value
                    ? "bg-[#0C5C57] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  (opt.value === "hazard" || opt.value === "alert") && settings.postType === opt.value && "bg-red-500"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
          <span className="text-sm font-medium text-[#111111]">Allow Comments</span>
          <Toggle checked={settings.commentsEnabled} onToggle={() => onChange({ ...settings, commentsEnabled: !settings.commentsEnabled })} />
        </div>
      </div>

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
