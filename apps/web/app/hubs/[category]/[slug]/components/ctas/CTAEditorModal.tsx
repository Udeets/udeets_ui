"use client";

import { useCallback, useEffect, useState } from "react";
import { GripVertical, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  CTA_ACTION_TYPES,
  MAX_CTAS_PER_HUB,
  type CTAActionType,
  type HubCTARecord,
} from "@/lib/services/ctas/cta-types";
import { saveAllHubCTAs } from "@/lib/services/ctas/upsert-ctas";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, cn } from "../hubUtils";

interface CTADraft {
  id?: string;
  label: string;
  action_type: CTAActionType;
  action_value: string;
  is_visible: boolean;
}

const ACTION_LABELS: Record<CTAActionType, string> = {
  url: "URL",
  whatsapp: "WhatsApp",
  phone: "Phone",
  maps: "Maps / Address",
  email: "Email",
  doordash: "DoorDash",
  ubereats: "UberEats",
  opentable: "OpenTable",
  instagram: "Instagram",
  pdf: "PDF Link",
};

const ACTION_PLACEHOLDERS: Record<CTAActionType, string> = {
  url: "https://example.com",
  whatsapp: "+1234567890",
  phone: "+1234567890",
  maps: "123 Main St, City, ST",
  email: "hello@example.com",
  doordash: "https://doordash.com/store/...",
  ubereats: "https://ubereats.com/store/...",
  opentable: "https://opentable.com/...",
  instagram: "https://instagram.com/handle",
  pdf: "https://example.com/menu.pdf",
};

function blankCTA(): CTADraft {
  return { label: "", action_type: "url", action_value: "", is_visible: true };
}

export function CTAEditorModal({
  hubId,
  existingCTAs,
  onClose,
  onSaved,
}: {
  hubId: string;
  existingCTAs: HubCTARecord[];
  onClose: () => void;
  onSaved: (ctas: HubCTARecord[]) => void;
}) {
  const [drafts, setDrafts] = useState<CTADraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingCTAs.length > 0) {
      setDrafts(
        existingCTAs.map((c) => ({
          id: c.id,
          label: c.label,
          action_type: c.action_type,
          action_value: c.action_value,
          is_visible: c.is_visible,
        }))
      );
    } else {
      setDrafts([blankCTA()]);
    }
  }, [existingCTAs]);

  const canAdd = drafts.length < MAX_CTAS_PER_HUB;

  const updateDraft = useCallback((index: number, patch: Partial<CTADraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }, []);

  const removeDraft = useCallback((index: number) => {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addDraft = useCallback(() => {
    setDrafts((prev) => (prev.length < MAX_CTAS_PER_HUB ? [...prev, blankCTA()] : prev));
  }, []);

  const moveDraft = useCallback((from: number, to: number) => {
    setDrafts((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const handleSave = async () => {
    setError(null);
    // validate
    const valid = drafts.filter((d) => d.label.trim() && d.action_value.trim());
    if (valid.length === 0 && drafts.length > 0) {
      setError("Each CTA needs a label and a value.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveAllHubCTAs(
        hubId,
        valid.map((d, i) => ({
          label: d.label.trim(),
          action_type: d.action_type,
          action_value: d.action_value.trim(),
          position: i,
          is_visible: d.is_visible,
        }))
      );
      onSaved(saved);
      onClose();
    } catch {
      setError("Failed to save CTAs. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111111]">Edit CTA Buttons</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Add up to {MAX_CTAS_PER_HUB} call-to-action buttons. Drag to reorder.
        </p>

        {/* CTA list */}
        <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="rounded-xl border border-slate-200 bg-[#F7FBFA] p-3"
            >
              <div className="flex items-center gap-2">
                {/* Reorder handle */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveDraft(index, index - 1)}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  {/* Label + type row */}
                  <div className="flex gap-2">
                    <input
                      value={draft.label}
                      onChange={(e) => updateDraft(index, { label: e.target.value })}
                      placeholder="Button label"
                      className="w-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-[#A9D1CA] focus:ring-2"
                    />
                    <select
                      value={draft.action_type}
                      onChange={(e) =>
                        updateDraft(index, { action_type: e.target.value as CTAActionType })
                      }
                      className="w-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-[#A9D1CA] focus:ring-2"
                    >
                      {CTA_ACTION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {ACTION_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value */}
                  <input
                    value={draft.action_value}
                    onChange={(e) => updateDraft(index, { action_value: e.target.value })}
                    placeholder={ACTION_PLACEHOLDERS[draft.action_type]}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-[#A9D1CA] focus:ring-2"
                  />

                  {/* Visibility toggle */}
                  <label className="flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={draft.is_visible}
                      onChange={(e) => updateDraft(index, { is_visible: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#0C5C57] focus:ring-[#A9D1CA]"
                    />
                    Visible
                  </label>
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeDraft(index)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove CTA"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {drafts.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              No CTA buttons yet. Add one below.
            </p>
          )}
        </div>

        {/* Add button */}
        {canAdd && (
          <button
            type="button"
            onClick={addDraft}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#0C5C57] transition hover:bg-[#EAF6F3]"
          >
            <Plus className="h-4 w-4" />
            Add CTA
          </button>
        )}

        {error && <p className="mt-2 text-xs font-medium text-[#B42318]">{error}</p>}

        {/* Footer */}
        <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className={BUTTON_SECONDARY}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(BUTTON_PRIMARY, isSaving && "cursor-not-allowed opacity-60")}
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </span>
            ) : (
              "Save CTAs"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
