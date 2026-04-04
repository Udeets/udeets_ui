/* eslint-disable @next/next/no-img-element */
"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";
import { BarChart3, Calendar, FileText, Images, MapPin, Megaphone, Paperclip, Settings, Smile, X } from "lucide-react";
import { ACTION_ICON, BUTTON_PRIMARY, ICON, cn } from "../hubUtils";
import type { AttachedDeetItem, ComposerChildFlow, DeetFormattingState } from "./deetTypes";

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
}) {
  const fontMenuRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isFontSizeMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!fontMenuRef.current?.contains(event.target as Node)) {
        onCloseFontSizeMenu();
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isFontSizeMenuOpen, onCloseFontSizeMenu]);

  const applyBold = () => {
    document.execCommand("bold");
    editorRef.current?.focus();
  };

  const applyItalic = () => {
    document.execCommand("italic");
    editorRef.current?.focus();
  };

  const applyUnderline = () => {
    document.execCommand("underline");
    editorRef.current?.focus();
  };

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
    if (editorRef.current) {
      onDraftTextChange(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== draftText) {
      editorRef.current.innerHTML = draftText;
    }
  }, [draftText]);

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[var(--ud-bg-overlay)] p-4">
      <div className="w-full rounded-[28px] border border-white/70 bg-[var(--ud-bg-card)] shadow-[0_24px_70px_rgba(15,23,42,0.28)]" style={{ maxWidth: "560px" }}>
        {/* Header: Close, Title, Post Button */}
        <div className="flex items-center justify-between border-b border-[var(--ud-border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--ud-border)] p-2 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            <X className={ICON} />
          </button>
          <h3 className="text-[20px] font-semibold tracking-tight text-[var(--ud-text-primary)]">Write Post</h3>
          <button
            type="submit"
            form="deet-form"
            disabled={isSubmitting}
            className={cn(BUTTON_PRIMARY, isSubmitting && "cursor-not-allowed opacity-60")}
          >
            {isSubmitting ? "Posting" : "Post"}
          </button>
        </div>

        <form id="deet-form" className="px-5 py-4" onSubmit={onSubmit}>
          {/* Author info */}
          <div className="mb-4 flex items-center gap-2">
            {authorAvatarSrc ? (
              <img
                src={authorAvatarSrc}
                alt={authorName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-[var(--ud-brand-primary)] flex items-center justify-center text-sm font-semibold text-[var(--ud-text-primary)]">
                {authorName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </div>
            )}
            <span className="text-sm font-medium text-[var(--ud-text-primary)]">{authorName}</span>
          </div>

          {/* Formatting toolbar */}
          <div className="relative z-10 mb-4 flex items-center gap-2">
            <div ref={fontMenuRef} className="relative">
              <button
                type="button"
                onClick={onToggleFontSizeMenu}
                className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-xl border border-[var(--ud-border)] px-3 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]"
              >
                Aa
              </button>

              {isFontSizeMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[124px] rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-2 shadow-lg">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => applyFontSize(size)}
                      className={cn(
                        "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                        formatting.fontSize === size ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]" : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
                      )}
                    >
                      {size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={applyBold}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm font-semibold text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]"
            >
              B
            </button>

            <button
              type="button"
              onClick={applyItalic}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm italic text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]"
            >
              I
            </button>

            <button
              type="button"
              onClick={applyUnderline}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-sm underline text-[var(--ud-text-secondary)] transition hover:border-[var(--ud-border)]"
            >
              U
            </button>

            <label className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--ud-border)] transition hover:border-[var(--ud-border)]">
              <span className="text-[var(--ud-brand-primary)]">A</span>
              <input
                type="color"
                value={formatting.textColor}
                onChange={(event) => applyTextColor(event.target.value)}
                aria-label="Choose text color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>

          {/* Rich text editor container */}
          <div className="rounded-[24px] border border-[var(--ud-border)] p-4 bg-[var(--ud-bg-card)]">
            {/* ContentEditable div */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              data-placeholder="Write something..."
              className="min-h-[180px] w-full outline-none text-base text-[var(--ud-text-primary)] whitespace-pre-wrap [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-[var(--ud-text-muted)]"
            />

            {/* Photo thumbnails strip (inside editor container) */}
            {selectedPhotoPreviews.length > 0 ? (
              <div className="mt-4 border-t border-[var(--ud-border)] pt-4">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {selectedPhotoPreviews.map((preview, index) => (
                    <div key={`preview-${index}`} className="relative shrink-0">
                      <img
                        src={preview}
                        alt={`Photo ${index + 1}`}
                        className="rounded-lg object-cover"
                        style={{ width: "60px", height: "60px" }}
                      />
                      {onRemovePhoto ? (
                        <button
                          type="button"
                          onClick={() => onRemovePhoto(index)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#111111]/80 text-white transition hover:bg-[#111111]"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Action icons row (inside editor container, at bottom) */}
            <div className="mt-4 border-t border-[var(--ud-border)] pt-4 flex items-center gap-3 text-[var(--ud-text-muted)]">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onOpenChild("photo")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Photo/Video"
              >
                <Images className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onOpenChild("emoji")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Sticker/Emoji"
              >
                <Smile className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onSetPostType?.("notice")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Announcement"
              >
                <Megaphone className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onSetPostType?.("notice")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Notice"
              >
                <FileText className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onSetPostType?.("post")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Poll"
              >
                <BarChart3 className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onOpenChild("photo")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Attach File"
              >
                <Paperclip className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onSetPostType?.("news")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Event"
              >
                <Calendar className={ICON} />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)]"
                title="Check-in"
              >
                <MapPin className={ICON} />
              </button>
            </div>
          </div>

          {/* Attached items display (outside editor) */}
          {attachedItems.length ? (
            <div className="mt-4 space-y-2">
              {attachedItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] px-4 py-3 text-sm text-[var(--ud-text-secondary)]">
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

          {/* Deet Settings button */}
          <div className="mt-5 flex items-center border-t border-[var(--ud-border)] pt-5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChild("settings")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ud-text-secondary)] transition hover:text-[var(--ud-brand-primary)]"
            >
              <Settings className={ACTION_ICON} />
              Deet Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
