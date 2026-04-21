/* eslint-disable @next/next/no-img-element */
"use client";

import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { ChevronDown, ChevronLeft, Settings, X } from "lucide-react";
import { BUTTON_PRIMARY, cn } from "../hubUtils";
import type { DeetFormattingState, DeetSettingsState } from "./deetTypes";
import { ComposerEmojiPicker } from "./ComposerEmojiPicker";
import { DeetSettingsFields } from "./DeetSettingsModal";
import type { ComposerContentKind, ComposerTypePayload } from "./composer/composerTypes";
import { ComposerInlineExtensions } from "./composer/ComposerInlineExtensions";
import {
  ComposerPhotoIcon,
  ComposerEmojiIcon,
  ComposerAnnouncementIcon,
  ComposerPollIcon,
  ComposerJobsIcon,
  ComposerCalendarIcon,
  ComposerAlertIcon,
  ComposerSurveyIcon,
  ComposerPaymentIcon,
} from "./ComposerIcons";

const ACTION_BTN =
  "inline-flex h-10 w-10 items-center justify-center rounded-full transition duration-150 hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-brand-primary)] active:scale-[0.96]";

const FORMAT_BAR_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ud-border)] text-[var(--ud-text-secondary)] transition duration-150 active:scale-[0.96] hover:border-[var(--ud-border)]";

type KindOption = { value: ComposerContentKind; label: string; short: string; blurb: string };

/** Grouped for the first-step picker (then one focused composer per choice). */
const KIND_GROUPS: Array<{ heading: string; hint?: string; items: KindOption[] }> = [
  {
    heading: "Updates",
    hint: "A deet is anything you share here—these are common ways to shape it in the feed.",
    items: [
      { value: "post", label: "General update", short: "Update", blurb: "Everyday share: text, photos, optional place on a map" },
      { value: "announcement", label: "Announcement", short: "Announce", blurb: "Something you want the whole hub to notice" },
      { value: "notice", label: "Notice", short: "Notice", blurb: "Formal or official note for the record" },
    ],
  },
  {
    heading: "Ask & measure",
    items: [
      { value: "poll", label: "Poll", short: "Poll", blurb: "Let people vote on options" },
      { value: "survey", label: "Survey", short: "Form", blurb: "Collect answers to questions" },
    ],
  },
  {
    heading: "Schedule",
    items: [{ value: "event", label: "Event", short: "Event", blurb: "Date, time, and location" }],
  },
  {
    heading: "Money & work",
    hint: "Raise money for a project or cause, or post an open role.",
    items: [
      { value: "payment", label: "Fundraiser", short: "Fund", blurb: "Set a goal and tell people how to chip in" },
      { value: "jobs", label: "Job posting", short: "Job", blurb: "Open role or gig details" },
    ],
  },
  {
    heading: "Safety",
    items: [{ value: "alert", label: "Alert", short: "Alert", blurb: "Urgent or safety-related heads-up" }],
  },
];

function composerKindPickerLabel(kind: ComposerContentKind): string {
  for (const g of KIND_GROUPS) {
    const hit = g.items.find((i) => i.value === kind);
    if (hit) return hit.label;
  }
  return headerTitle(kind);
}

function headerTitle(kind: ComposerContentKind): string {
  const labels: Record<ComposerContentKind, string> = {
    post: "Write Your Deet",
    announcement: "New Announcement",
    notice: "New Notice",
    poll: "New Poll",
    event: "New Event",
    alert: "New Alert",
    survey: "New Survey",
    payment: "New Fundraiser",
    jobs: "New Job",
  };
  return labels[kind];
}

function titleFieldMeta(kind: ComposerContentKind): { label: string; placeholder: string; optional: boolean } {
  switch (kind) {
    case "post":
      return { label: "Title (optional)", placeholder: "Add a headline…", optional: true };
    case "poll":
      return { label: "Poll question", placeholder: "What do you want to ask?", optional: false };
    case "event":
      return { label: "Event name", placeholder: "e.g. Community meetup", optional: false };
    case "survey":
      return { label: "Survey title", placeholder: "e.g. Community feedback", optional: false };
    case "payment":
      return { label: "Fundraiser title", placeholder: "e.g. Spring cleanup supplies", optional: false };
    case "jobs":
      return { label: "Job title", placeholder: "e.g. Community manager", optional: false };
    case "alert":
      return { label: "Alert title", placeholder: "e.g. Road closure", optional: false };
    case "announcement":
      return { label: "Headline", placeholder: "e.g. Important update", optional: false };
    case "notice":
      return { label: "Notice title", placeholder: "e.g. Parking reminder", optional: false };
    default:
      return { label: "Title", placeholder: "", optional: true };
  }
}

function ComposerFormattingToolbar({
  fontMenuRef,
  isFontSizeMenuOpen,
  onToggleFontSizeMenu,
  formatting,
  onFontSizePick,
  onTextColorChange,
  onBold,
  onItalic,
  onUnderline,
}: {
  fontMenuRef: RefObject<HTMLDivElement | null>;
  isFontSizeMenuOpen: boolean;
  onToggleFontSizeMenu: () => void;
  formatting: DeetFormattingState;
  onFontSizePick: (size: "small" | "medium" | "large") => void;
  onTextColorChange: (color: string) => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={fontMenuRef} className="relative">
        <button
          type="button"
          onClick={onToggleFontSizeMenu}
          className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-xl border border-[var(--ud-border)] px-3 text-sm font-medium text-[var(--ud-text-secondary)] transition duration-150 active:scale-[0.96] hover:border-[var(--ud-border)]"
        >
          Aa
        </button>
        {isFontSizeMenuOpen ? (
          <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[124px] rounded-2xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-2 shadow-lg">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onFontSizePick(size)}
                className={cn(
                  "block w-full rounded-xl px-3 py-2 text-left text-sm transition duration-150",
                  formatting.fontSize === size
                    ? "bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]"
                    : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
                )}
              >
                {size === "small" ? "Small" : size === "medium" ? "Medium" : "Large"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <button type="button" onClick={onBold} className={cn(FORMAT_BAR_BTN, "text-sm font-semibold")}>
        B
      </button>
      <button type="button" onClick={onItalic} className={cn(FORMAT_BAR_BTN, "text-sm italic")}>
        I
      </button>
      <button type="button" onClick={onUnderline} className={cn(FORMAT_BAR_BTN, "text-sm underline")}>
        U
      </button>
      <label className={cn(FORMAT_BAR_BTN, "relative inline-flex w-9 cursor-pointer")}>
        <span className="text-[var(--ud-brand-primary)]">A</span>
        <input
          type="color"
          value={formatting.textColor}
          onChange={(event) => onTextColorChange(event.target.value)}
          aria-label="Choose text color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

export function CreateDeetModal({
  submitError,
  composerEntryStep,
  onBackToPickStep,
  onPickComposerKind,
  composerKind,
  composerTitle,
  onComposerTitleChange,
  draftText,
  onDraftTextChange,
  composerTypePayload,
  onComposerTypePayloadChange,
  formatting,
  onFormattingChange,
  isFontSizeMenuOpen,
  onToggleFontSizeMenu,
  selectedPhotoPreviews = [],
  onRemovePhoto,
  onClose,
  onSubmit,
  isSubmitting,
  onCloseFontSizeMenu,
  deetPhotoInputRef,
  onPhotoFilesChange,
  pickPhotosOnOpen,
  onConsumePickPhotosIntent,
  deetSettings,
  onDeetSettingsChange,
  composerAccessoryPanel,
  onComposerAccessoryChange,
  isEditMode = false,
  editPersistedGalleryUrls = [],
  onRemovePersistedGalleryPhoto,
  authorName = "You",
  authorAvatarSrc,
  onSetPostType,
  currentPostType,
}: {
  submitError?: string | null;
  composerEntryStep: "pick" | "compose";
  onBackToPickStep: () => void;
  onPickComposerKind: (kind: ComposerContentKind) => void;
  composerKind: ComposerContentKind;
  composerTitle: string;
  onComposerTitleChange: (value: string) => void;
  draftText: string;
  onDraftTextChange: Dispatch<SetStateAction<string>>;
  composerTypePayload: ComposerTypePayload;
  onComposerTypePayloadChange: (next: ComposerTypePayload) => void;
  formatting: DeetFormattingState;
  onFormattingChange: (next: DeetFormattingState) => void;
  isFontSizeMenuOpen: boolean;
  onToggleFontSizeMenu: () => void;
  selectedPhotoPreviews?: string[];
  onRemovePhoto?: (index: number) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  onCloseFontSizeMenu: () => void;
  deetPhotoInputRef: RefObject<HTMLInputElement | null>;
  onPhotoFilesChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  pickPhotosOnOpen: boolean;
  onConsumePickPhotosIntent: () => void;
  deetSettings: DeetSettingsState;
  onDeetSettingsChange: Dispatch<SetStateAction<DeetSettingsState>>;
  composerAccessoryPanel: null | "emoji" | "settings";
  onComposerAccessoryChange: (panel: null | "emoji" | "settings") => void;
  /** When true, hide type picker back affordance and adjust labels for editing an existing deet. */
  isEditMode?: boolean;
  editPersistedGalleryUrls?: string[];
  onRemovePersistedGalleryPhoto?: (index: number) => void;
  authorName?: string;
  authorAvatarSrc?: string;
  onSetPostType?: (postType: string) => void;
  /** Current Local-feed tag so the corresponding chip can show as active. */
  currentPostType?: string;
}) {
  void authorName;
  void authorAvatarSrc;

  const fontMenuMobileRef = useRef<HTMLDivElement | null>(null);
  const fontMenuDesktopRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const accessoryShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFontSizeMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const t = event.target as Node;
      if (fontMenuMobileRef.current?.contains(t) || fontMenuDesktopRef.current?.contains(t)) return;
      onCloseFontSizeMenu();
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isFontSizeMenuOpen, onCloseFontSizeMenu]);

  useEffect(() => {
    if (!pickPhotosOnOpen) return;
    deetPhotoInputRef.current?.click();
    onConsumePickPhotosIntent();
  }, [pickPhotosOnOpen, deetPhotoInputRef, onConsumePickPhotosIntent]);

  useEffect(() => {
    if (!composerAccessoryPanel) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!accessoryShellRef.current?.contains(event.target as Node)) {
        onComposerAccessoryChange(null);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [composerAccessoryPanel, onComposerAccessoryChange]);

  useEffect(() => {
    if (!isFontSizeMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onCloseFontSizeMenu();
    };
    window.addEventListener("keydown", handleEscape, true);
    return () => window.removeEventListener("keydown", handleEscape, true);
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
    if (editorRef.current) onDraftTextChange(editorRef.current.innerHTML);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== draftText) {
      editorRef.current.innerHTML = draftText;
    }
  }, [draftText]);

  const titleMeta = titleFieldMeta(composerKind);
  const kindIcon = (k: ComposerContentKind) => {
    const cls = "h-[18px] w-[18px]";
    switch (k) {
      case "post":
        return null;
      case "announcement":
      case "notice":
        return <ComposerAnnouncementIcon className={cls} />;
      case "poll":
        return <ComposerPollIcon className={cls} />;
      case "jobs":
        return <ComposerJobsIcon className={cls} />;
      case "event":
        return <ComposerCalendarIcon className={cls} />;
      case "alert":
        return <ComposerAlertIcon className={cls} />;
      case "survey":
        return <ComposerSurveyIcon className={cls} />;
      case "payment":
        return <ComposerPaymentIcon className={cls} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center bg-[var(--ud-bg-overlay)] p-0 transition-[background-color] duration-200 sm:items-center sm:p-4">
      <div
        className="flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-lg transition-shadow duration-300 sm:max-h-[90vh] sm:rounded-xl sm:shadow-xl"
        style={{ maxWidth: "720px" }}
      >
        <div className="grid shrink-0 grid-cols-[minmax(40px,auto)_1fr_minmax(40px,auto)] items-center gap-2 border-b border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex justify-start">
            {composerEntryStep === "compose" && !isEditMode ? (
              <button
                type="button"
                onClick={onBackToPickStep}
                className="rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-card)] hover:text-[var(--ud-text-primary)]"
                aria-label="Change deet type"
                title="Change type"
              >
                <ChevronLeft className="h-5 w-5 stroke-[1.8]" />
              </button>
            ) : null}
          </div>
          <h3 className="min-w-0 truncate text-center text-sm font-semibold text-[var(--ud-text-primary)] sm:text-base">
            {composerEntryStep === "pick" ? "Create a Deet" : isEditMode ? "Edit your deet" : headerTitle(composerKind)}
          </h3>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-card)] hover:text-[var(--ud-text-primary)]"
              aria-label="Close"
            >
              <X className="h-5 w-5 stroke-[1.8]" />
            </button>
          </div>
        </div>

        <form
          id="deet-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            if (composerEntryStep === "pick") {
              event.preventDefault();
              return;
            }
            onSubmit(event);
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {submitError ? (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-900"
              >
                {submitError}
              </div>
            ) : null}

            {composerEntryStep === "pick" ? (
              <div className="space-y-6 pb-4">
                <p className="text-center text-sm leading-relaxed text-[var(--ud-text-secondary)]">
                  Whatever you share here is a deet—a casual note, a big announcement, a fundraiser, you name it. Choose the type that feels closest; we&apos;ll open the editor next. Need a different layout? Use Back.
                </p>
                {KIND_GROUPS.map((group) => (
                  <div key={group.heading}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ud-text-muted)]">{group.heading}</p>
                    {group.hint ? <p className="mb-2 text-xs leading-snug text-[var(--ud-text-muted)]">{group.hint}</p> : null}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                      {group.items.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onPickComposerKind(item.value)}
                          className={cn(
                            "flex flex-col items-start gap-1.5 rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] px-3 py-3 text-left transition duration-150",
                            "hover:border-[var(--ud-border)] hover:bg-[var(--ud-bg-subtle)] active:scale-[0.99]"
                          )}
                        >
                          <div className="flex w-full items-center gap-2">
                            {kindIcon(item.value) ? <span className="shrink-0">{kindIcon(item.value)}</span> : null}
                            <span className="text-sm font-semibold text-[var(--ud-text-primary)]">{item.label}</span>
                          </div>
                          <span className="text-[11px] leading-snug text-[var(--ud-text-muted)]">{item.blurb}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {composerEntryStep === "compose" ? (
            <>
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/60 px-3 py-2.5 sm:px-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ud-text-muted)]">
                {isEditMode ? "Post type" : "Type"}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-1 text-xs font-semibold text-[var(--ud-text-primary)]">
                {kindIcon(composerKind) ? <span className="shrink-0">{kindIcon(composerKind)}</span> : null}
                <span className="truncate">{composerKindPickerLabel(composerKind)}</span>
              </span>
              {!isEditMode ? (
                <span className="text-[11px] leading-snug text-[var(--ud-text-muted)]">
                  Use the back arrow to choose a different type.
                </span>
              ) : null}
            </div>
            {composerKind === "post" && onSetPostType ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ud-text-muted)]">Tag</span>
                {(
                  [
                    { key: "news", label: "#News" },
                    { key: "hazard", label: "#Hazard" },
                    { key: "deal", label: "#Deals" },
                    { key: "jobs", label: "#Jobs" },
                  ] as const
                ).map((tag) => {
                  const active = currentPostType === tag.key;
                  return (
                    <button
                      key={tag.key}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onSetPostType(active ? "post" : tag.key)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition",
                        active
                          ? "border-[var(--ud-brand-primary)] bg-[var(--ud-brand-primary)] text-white"
                          : "border-[var(--ud-border)] text-[var(--ud-text-secondary)] hover:border-[var(--ud-brand-primary)] hover:text-[var(--ud-brand-primary)]"
                      )}
                      title={active ? `Remove ${tag.label}` : `Tag as ${tag.label} — also publishes to the Local feed`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
                {currentPostType && ["news", "hazard", "deal", "jobs"].includes(currentPostType) ? (
                  <span className="text-[11px] text-[var(--ud-text-muted)]">Will show in Local</span>
                ) : null}
              </div>
            ) : null}
            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--ud-text-muted)]">
                {titleMeta.label}
                {titleMeta.optional ? <span className="font-normal text-[var(--ud-text-muted)]"> — optional</span> : null}
              </label>
              <input
                value={composerTitle}
                onChange={(e) => onComposerTitleChange(e.target.value)}
                placeholder={titleMeta.placeholder}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-input)] px-3 py-2 text-sm font-medium text-[var(--ud-text-primary)] outline-none focus:border-[var(--ud-border-focus)]"
              />
            </div>

            <details
              className="group mb-3 rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/40 open:shadow-sm transition-shadow duration-200 sm:hidden"
              onToggle={(event) => {
                if (!(event.currentTarget as HTMLDetailsElement).open) onCloseFontSizeMenu();
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-medium text-[var(--ud-text-primary)] [&::-webkit-details-marker]:hidden">
                <span>Text & Style</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ud-text-muted)] transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="border-t border-[var(--ud-border-subtle)] px-2 pb-3 pt-2">
                <ComposerFormattingToolbar
                  fontMenuRef={fontMenuMobileRef}
                  isFontSizeMenuOpen={isFontSizeMenuOpen}
                  onToggleFontSizeMenu={onToggleFontSizeMenu}
                  formatting={formatting}
                  onFontSizePick={applyFontSize}
                  onTextColorChange={applyTextColor}
                  onBold={applyBold}
                  onItalic={applyItalic}
                  onUnderline={applyUnderline}
                />
              </div>
            </details>

            <div className="relative z-10 mb-3 hidden flex-wrap items-center gap-2 sm:flex">
              <ComposerFormattingToolbar
                fontMenuRef={fontMenuDesktopRef}
                isFontSizeMenuOpen={isFontSizeMenuOpen}
                onToggleFontSizeMenu={onToggleFontSizeMenu}
                formatting={formatting}
                onFontSizePick={applyFontSize}
                onTextColorChange={applyTextColor}
                onBold={applyBold}
                onItalic={applyItalic}
                onUnderline={applyUnderline}
              />
            </div>

            <div className="rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-3 transition-shadow duration-200 sm:p-4">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                data-placeholder={
                  composerKind === "post"
                    ? "Write something… Add photos from the bar below, or tag an optional place."
                    : "Add details, context, or instructions…"
                }
                className="min-h-[120px] w-full text-base leading-relaxed text-[var(--ud-text-primary)] outline-none transition-[min-height] duration-200 sm:min-h-[160px] sm:text-[17px] whitespace-pre-wrap [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-[var(--ud-text-muted)]"
              />

              <input ref={deetPhotoInputRef} type="file" accept="image/*" multiple onChange={onPhotoFilesChange} className="hidden" />

              {editPersistedGalleryUrls.length > 0 || selectedPhotoPreviews.length > 0 ? (
                <div className="mt-4 border-t border-[var(--ud-border)] pt-4">
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {editPersistedGalleryUrls.map((preview, index) => (
                      <div key={`persisted-${preview}-${index}`} className="relative shrink-0">
                        <img
                          src={preview}
                          alt=""
                          className="rounded-lg object-cover transition-transform duration-150 hover:scale-[1.04]"
                          style={{ width: "60px", height: "60px" }}
                        />
                        {onRemovePersistedGalleryPhoto ? (
                          <button
                            type="button"
                            onClick={() => onRemovePersistedGalleryPhoto(index)}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#111111]/80 text-white transition hover:bg-[#111111]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {selectedPhotoPreviews.map((preview, index) => (
                      <div key={`preview-${index}`} className="relative shrink-0">
                        <img
                          src={preview}
                          alt=""
                          className="rounded-lg object-cover transition-transform duration-150 hover:scale-[1.04]"
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
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/80 p-4 shadow-sm transition-shadow duration-200">
              <ComposerInlineExtensions
                kind={composerKind}
                payload={composerTypePayload}
                disabled={isSubmitting}
                onPayloadChange={onComposerTypePayloadChange}
              />
            </div>

            </>
            ) : null}
          </div>

          {composerEntryStep === "compose" ? (
          <div
            ref={accessoryShellRef}
            className="relative shrink-0 border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-subtle)]/60 px-4 py-3 sm:px-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[var(--ud-text-muted)]">
                <button type="button" disabled={isSubmitting} onClick={() => deetPhotoInputRef.current?.click()} className={ACTION_BTN} title="Photo">
                  <ComposerPhotoIcon className="h-[22px] w-[22px]" />
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-pressed={composerAccessoryPanel === "emoji"}
                  onClick={() => onComposerAccessoryChange(composerAccessoryPanel === "emoji" ? null : "emoji")}
                  className={cn(ACTION_BTN, composerAccessoryPanel === "emoji" && "bg-[var(--ud-bg-card)] text-[var(--ud-brand-primary)] shadow-sm")}
                  title="Emoji"
                >
                  <ComposerEmojiIcon className="h-[22px] w-[22px]" />
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  aria-pressed={composerAccessoryPanel === "settings"}
                  onClick={() => onComposerAccessoryChange(composerAccessoryPanel === "settings" ? null : "settings")}
                  className={cn(ACTION_BTN, composerAccessoryPanel === "settings" && "bg-[var(--ud-bg-card)] text-[var(--ud-brand-primary)] shadow-sm")}
                  title="Deet settings"
                >
                  <Settings className="h-[22px] w-[22px] stroke-[1.5]" />
                </button>
              </div>
              <button
                type="submit"
                form="deet-form"
                disabled={isSubmitting}
                className={cn(BUTTON_PRIMARY, "shrink-0 px-4 py-2 text-sm", isSubmitting && "cursor-not-allowed opacity-60")}
              >
                {isSubmitting ? (isEditMode ? "Saving…" : "Publishing…") : isEditMode ? "Save changes" : "Publish"}
              </button>
            </div>

            {composerAccessoryPanel === "emoji" ? (
              <div className="mt-3 max-h-[min(340px,42vh)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-3 shadow-sm sm:max-h-[min(380px,45vh)] sm:p-4">
                <div className="mb-2 flex items-center justify-between sm:mb-3">
                  <span className="text-sm font-semibold text-[var(--ud-text-primary)]">Emoji & stickers</span>
                  <button
                    type="button"
                    onClick={() => onComposerAccessoryChange(null)}
                    className="rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
                    aria-label="Close emoji picker"
                  >
                    <X className="h-4 w-4 stroke-[1.8]" />
                  </button>
                </div>
                <ComposerEmojiPicker
                  onPick={(emoji) => {
                    onDraftTextChange((prev) => `${prev}${emoji}`);
                    editorRef.current?.focus();
                  }}
                />
              </div>
            ) : null}

            {composerAccessoryPanel === "settings" ? (
              <div className="mt-3 max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] p-3 shadow-sm sm:p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--ud-text-primary)]">Deet settings</span>
                  <button
                    type="button"
                    onClick={() => onComposerAccessoryChange(null)}
                    className="rounded-full p-1.5 text-[var(--ud-text-muted)] transition hover:bg-[var(--ud-bg-subtle)] hover:text-[var(--ud-text-primary)]"
                    aria-label="Close settings"
                  >
                    <X className="h-4 w-4 stroke-[1.8]" />
                  </button>
                </div>
                <DeetSettingsFields settings={deetSettings} onChange={onDeetSettingsChange} disabled={isSubmitting} />
              </div>
            ) : null}
          </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
