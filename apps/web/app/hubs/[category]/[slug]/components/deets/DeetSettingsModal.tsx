"use client";

import { BUTTON_PRIMARY, BUTTON_SECONDARY, cn } from "../hubUtils";
import type { DeetSettingsState } from "./deetTypes";

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
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
          <span className="text-sm font-medium text-[#111111]">Add as Notice</span>
          <Toggle checked={settings.noticeEnabled} onToggle={() => onChange({ ...settings, noticeEnabled: !settings.noticeEnabled })} />
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
