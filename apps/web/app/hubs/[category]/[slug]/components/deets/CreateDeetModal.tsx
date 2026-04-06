/* eslint-disable @next/next/no-img-element */
"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";
import { BarChart3, Calendar, Images, MapPin, Megaphone, Paperclip, Settings, Smile, X } from "lucide-react";
import { BUTTON_PRIMARY, cn } from "../hubUtils";
import type { AttachedDeetItem, ComposerChildFlow, DeetFormattingState } from "./deetTypes";

const ACTION_BTN = "inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]";
const ACTION_ICON_CLS = "h-5 w-5 stroke-[1.5]";

export function CreateDeetModal({
  draftText,
  onDraftTextChange,
  formatting,
  onFormattingChange,
  isFontSizeMenuOpen,
  onToggleFontSizeMenu,
  attachedItems,
  selectedPhotoPreviews = [],
  onRemovePhoto,
  onClose,
  onOpenChild,
  onSubmit,
  isSubmitting,
  onCloseFontSizeMenu,
  authorName = "You",
  authorAvatarSrc,
  onSetPostType,
  isNotice,
  onToggleNotice,
}: {
  draftText: string;
  onDraftTextChange: (value: string) => void;
  formatting: DeetFormattingState;
  onFormattingChange: (next: DeetFormattingState) => void;
  isFontSizeMenuOpen: boolean;
  onToggleFontSizeMenu: () => void;
  attachedItems: AttachedDeetItem[];
  selectedPhotoPreviews?: string[];
  onRemovePhoto?: (index: number) => void;
  onClose: () => void;
  onOpenChild: (child: Exclude<ComposerChildFlow, "quit_confirm">) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  onCloseFontSizeMenu: () => void;
  authorName?: string;
  authorAvatarSrc?: string;
  onSetPostType?: (postType: string) => void;
  isNotice?: boolean;
  onToggleNotice?: () => void;
}) {
  const fontMenuRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFontSizeMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!fontMenuRef.current?.contains(event.target as Node)) onCloseFontSizeMenu();
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isFontSizeMenuOpen, onCloseFontSizeMenu]);

  const applyBold = () => { document.execCommand("bold"); editorRef.current?.focus(); };
  const applyItalic = () => { document.execCommand("italic"); editorRef.current?.focus(); };
  const applyUnderline = () => { document.execCommand("underline"); editorRef.current?.focus(); };

  const applyFontSize = (size: "small" | "medium" | "large") => {
    const sizeValue = size === "small" ? "1" : size === "medium" ? "3" : "5";
    document.execCommand("fontSize", false, sizeValue);
    onFormattingChange({ ...formatting, fontSize: size });
    onCloseFontSizeMenu();
    editorRef.current?.focus();
  };

  const applyTextColor = (color: string) => {
    document.execCommand("foreColor", false, color);
    onFormattingChange({ ...formatting, textColor: color });
    editorRef.current?.focus();
  };

  const handleEditorInput = () => {
    if (editorRef.current) onDraftTextChange(editorRef.current.innerHTML);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== draftText) {
      editorRef.current.innerHTML = draftText;
    }
  }, [draftText]);

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[var(--ud-bg-overlay)] p-4">
      <div className="w-full overflow-hidden rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-lg" style={{ maxWidth: "560px" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-5 py-3.5">
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-card)] hover:text-[var(--ud-text-primary)]">
            <X className="h-5 w-5 stroke-[1.8]" />
          </button>
          <h3 className="text-base font-semibold text-[var(--ud-text-primary)]">Write Post</h3>
          <button type="submit" form="deet-form" disabled={isSubmitting} className={cn(BUTTON_PRIMARY, isSubmitting && "cursor-not-allowed opacity-60")}>
            {isSubmitting ? "Posting" : "Post"}
          </button>
        </div>

        <form id="deet-form" className="px-5 py-4" onSubmit={onSubmit}>
          {/* Formatting toolbar */}
          <div className="relative z-10 mb-4 flex items-center gap-2">
            <div ref={fontMenuRef} className="relative">
              <button type="button" onClick={onToggleFontSizeMenu} className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-xl border border-[var(--ud-border)] px-3 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]">
                Aa
              </button>
              {isFontSizeMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[124px] rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-2 shadow-lg">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button key={size} type="button" onClick={() => applyFontSize(size)} className={cn("block w-full rounded-xl px-3 py-2 text-left text-sm transition", formatting.fontSize === size ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]" : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]")}>
                      {size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" onClick={applyBold} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm font-semibold text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]">B</button>
            <button type="button" onClick={applyItalic} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm italic text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]">I</button>
            <button type="button" onClick={applyUnderline} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm underline text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]">U</button>
            <label className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--ud-border)] transition hover:border-[var(--ud-border)]">
              <span className="text-[var(--ud-brand-primary)]">A</span>
              <input type="color" value={formatting.textColor} onChange={(event) => applyTextColor(event.target.value)} aria-label="Choose text color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
          </div>

          {/* Rich text editor */}
          <div className="rounded-xl border border-[var(--ud-border-subtle)] p-4 bg-[var(--ud-bg-card)]">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              data-placeholder="Write something..."
              className="min-h-[150px] w-full outline-none text-base text-[var(--ud-text-primary)] whitespace-pre-wrap [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-[var(--ud-text-muted)]"
            />

            {/* Photo thumbnails */}
            {selectedPhotoPreviews.length > 0 ? (
              <div className="mt-4 border-t border-[var(--ud-border)] pt-4">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {selectedPhotoPreviews.map((preview, index) => (
                    <div key={`preview-${index}`} className="relative shrink-0">
                      <img src={preview} alt={`Photo ${index + 1}`} className="rounded-lg object-cover" style={{ width: "60px", height: "60px" }} />
                      {onRemovePhoto ? (
                        <button type="button" onClick={() => onRemovePhoto(index)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#111111]/80 text-white transition hover:bg-[#111111]">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Action buttons row */}
          <div className="mt-4 flex flex-wrap items-center gap-1 text-[var(--ud-text-muted)]">
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("photo")} className={ACTION_BTN} title="Photo/Video">
              <Images className={ACTION_ICON_CLS} />
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("emoji")} className={ACTION_BTN} title="Sticker/Emoji">
              <Smile className={ACTION_ICON_CLS} />
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("announcement")} className={ACTION_BTN} title="Announcement">
              <Megaphone className={ACTION_ICON_CLS} />
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("poll")} className={ACTION_BTN} title="Poll">
              <BarChart3 className={ACTION_ICON_CLS} />
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("photo")} className={ACTION_BTN} title="Attach File">
              <Paperclip className={ACTION_ICON_CLS} />
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("event")} className={ACTION_BTN} title="Event">
              <Calendar className={ACTION_ICON_CLS} />
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("checkin")} className={ACTION_BTN} title="Check-in">
              <MapPin className={ACTION_ICON_CLS} />
            </button>
          </div>

          {/* Attached items */}
          {attachedItems.length ? (
            <div className="mt-4 space-y-2">
              {attachedItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-4 py-3 text-sm text-[var(--ud-text-secondary)]">
                  <div className="font-medium text-[var(--ud-text-primary)]">{item.title}</div>
                  {item.detail ? <div className="mt-1 text-[var(--ud-text-muted)]">{item.detail}</div> : null}
                  {item.previews?.length ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {item.previews.map((preview, index) => (
                        <img key={`${preview}-${index}`} src={preview} alt={`Attached ${index + 1}`} className="aspect-square rounded-xl object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {/* Deet Settings + Mark as notice */}
          <div className="mt-4 flex items-center justify-between border-t border-[var(--ud-border-subtle)] pt-4">
            <button type="button" disabled={isSubmitting} onClick={() => onOpenChild("settings")} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-brand-primary)]">
              <Settings className="h-5 w-5 stroke-[1.5]" />
              Deet Settings
            </button>
            {onToggleNotice && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--ud-text-secondary)]">
                <input
                  type="checkbox"
                  checked={isNotice ?? false}
                  onChange={onToggleNotice}
                  className="h-4 w-4 rounded border-[var(--ud-border)] text-[var(--ud-brand-primary)] accent-[var(--ud-brand-primary)]"
                />
                Mark as notice
              </label>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
