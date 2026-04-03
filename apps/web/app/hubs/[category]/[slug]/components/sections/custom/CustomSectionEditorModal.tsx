"use client";

import { GripVertical, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { HubSection, SectionTag } from "@/lib/services/sections/section-types";
import { SECTION_TAGS, TAG_LABELS, MAX_SECTIONS_PER_HUB, MAX_ITEMS_PER_SECTION } from "@/lib/services/sections/section-types";
import { saveHubSections } from "@/lib/services/sections/save-sections";
import { cn } from "../../hubUtils";

interface DraftItem {
  tempId: string;
  label: string;
  tag: SectionTag | "";
  value: string;
}

interface DraftSection {
  tempId: string;
  title: string;
  is_visible: boolean;
  items: DraftItem[];
}

function makeTempId() {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDraftSections(sections: HubSection[]): DraftSection[] {
  if (sections.length === 0) return [];
  return sections.map((s) => ({
    tempId: s.id,
    title: s.title,
    is_visible: s.is_visible,
    items: s.items.map((item) => ({
      tempId: item.id,
      label: item.label,
      tag: (item.tag as SectionTag) || "",
      value: item.value || "",
    })),
  }));
}

export function CustomSectionEditorModal({
  hubId,
  sections,
  onClose,
  onSaved,
}: {
  hubId: string;
  sections: HubSection[];
  onClose: () => void;
  onSaved: (sections: HubSection[]) => void;
}) {
  const [drafts, setDrafts] = useState<DraftSection[]>(() => toDraftSections(sections));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSection = () => {
    if (drafts.length >= MAX_SECTIONS_PER_HUB) return;
    setDrafts([
      ...drafts,
      { tempId: makeTempId(), title: "", is_visible: true, items: [] },
    ]);
  };

  const removeSection = (idx: number) => {
    setDrafts(drafts.filter((_, i) => i !== idx));
  };

  const updateSectionTitle = (idx: number, title: string) => {
    setDrafts(drafts.map((s, i) => (i === idx ? { ...s, title } : s)));
  };

  const addItem = (sectionIdx: number) => {
    setDrafts(
      drafts.map((s, i) =>
        i === sectionIdx && s.items.length < MAX_ITEMS_PER_SECTION
          ? { ...s, items: [...s.items, { tempId: makeTempId(), label: "", tag: "", value: "" }] }
          : s
      )
    );
  };

  const removeItem = (sectionIdx: number, itemIdx: number) => {
    setDrafts(
      drafts.map((s, i) =>
        i === sectionIdx ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) } : s
      )
    );
  };

  const updateItem = (sectionIdx: number, itemIdx: number, field: keyof DraftItem, value: string) => {
    setDrafts(
      drafts.map((s, i) =>
        i === sectionIdx
          ? { ...s, items: s.items.map((item, j) => (j === itemIdx ? { ...item, [field]: value } : item)) }
          : s
      )
    );
  };

  const handleSave = async () => {
    const validSections = drafts.filter((s) => s.title.trim());
    if (validSections.length === 0 && drafts.length > 0) {
      setError("Each section needs a title.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const saved = await saveHubSections(
        hubId,
        validSections.map((s, idx) => ({
          title: s.title,
          position: idx,
          is_visible: s.is_visible,
          items: s.items
            .filter((item) => item.label.trim())
            .map((item, jdx) => ({
              label: item.label,
              tag: item.tag || null,
              value: item.value || null,
              position: jdx,
            })),
        }))
      );
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sections.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/40 p-4">
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#111111]">Custom Sections</h3>
            <p className="mt-1 text-sm text-slate-500">Add sections with titles and bullet points.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sections */}
        <div className="mt-5 space-y-5">
          {drafts.map((section, sIdx) => (
            <div key={section.tempId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                <input
                  value={section.title}
                  onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                  placeholder="Section title (e.g. Hours, Menu, Rules)"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#A9D1CA] focus:ring-1 focus:ring-[#A9D1CA]"
                />
                <button type="button" onClick={() => removeSection(sIdx)} className="rounded p-1 text-slate-400 transition hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Items */}
              <div className="mt-3 space-y-2">
                {section.items.map((item, iIdx) => (
                  <div key={item.tempId} className="flex items-start gap-2">
                    <select
                      value={item.tag}
                      onChange={(e) => updateItem(sIdx, iIdx, "tag", e.target.value)}
                      className="mt-0.5 w-24 shrink-0 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none transition focus:border-[#A9D1CA]"
                    >
                      <option value="">No tag</option>
                      {SECTION_TAGS.map((tag) => (
                        <option key={tag} value={tag}>{TAG_LABELS[tag]}</option>
                      ))}
                    </select>
                    <input
                      value={item.label}
                      onChange={(e) => updateItem(sIdx, iIdx, "label", e.target.value)}
                      placeholder="Bullet point text"
                      className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none transition focus:border-[#A9D1CA]"
                    />
                    <button type="button" onClick={() => removeItem(sIdx, iIdx)} className="mt-1 rounded p-0.5 text-slate-400 transition hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {section.items.length < MAX_ITEMS_PER_SECTION ? (
                  <button
                    type="button"
                    onClick={() => addItem(sIdx)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0C5C57] transition hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add bullet point
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Add section button */}
        {drafts.length < MAX_SECTIONS_PER_HUB ? (
          <button
            type="button"
            onClick={addSection}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-[#A9D1CA] hover:text-[#0C5C57]"
          >
            <Plus className="h-4 w-4" /> Add Section
          </button>
        ) : null}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-semibold transition",
              isSaving ? "cursor-not-allowed bg-slate-200 text-slate-400" : "bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] text-white hover:opacity-90"
            )}
          >
            {isSaving ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Save Sections"}
          </button>
        </div>
      </div>
    </div>
  );
}
