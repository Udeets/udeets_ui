/* eslint-disable @next/next/no-img-element */
"use client";

import type { FormEvent } from "react";
import { useEffect, useRef } from "react";
import { Images, Settings, Smile, X } from "lucide-react";
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
  onClose,
  onOpenChild,
  onSubmit,
  isSubmitting,
  onCloseFontSizeMenu,
}: {
  draftText: string;
  onDraftTextChange: (value: string) => void;
  formatting: DeetFormattingState;
  onFormattingChange: (next: DeetFormattingState) => void;
  isFontSizeMenuOpen: boolean;
  onToggleFontSizeMenu: () => void;
  attachedItems: AttachedDeetItem[];
  onClose: () => void;
  onOpenChild: (child: Exclude<ComposerChildFlow, "quit_confirm">) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  onCloseFontSizeMenu: () => void;
}) {
  const fontMenuRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[rgba(15,23,42,0.62)] p-4">
      <div className="w-full rounded-[28px] border border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]" style={{ maxWidth: "560px" }}>
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <div className="w-10" />
          <h3 className="text-[20px] font-serif font-semibold tracking-tight text-[#111111]">Create Deet</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X className={ICON} />
          </button>
        </div>

        <form className="px-5 pb-5" onSubmit={onSubmit}>
          <div className="relative z-10 mt-3 flex items-center justify-center gap-2">
            <div ref={fontMenuRef} className="relative">
              <button
                type="button"
                onClick={onToggleFontSizeMenu}
                className="inline-flex h-9 min-w-[40px] items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600"
              >
                aA
              </button>

              {isFontSizeMenuOpen ? (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 min-w-[124px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onFormattingChange({ ...formatting, fontSize: size })}
                      className={cn(
                        "block w-full rounded-xl px-3 py-2 text-left text-sm transition",
                        formatting.fontSize === size ? "bg-[#EAF6F3] text-[#0C5C57]" : "text-slate-600 hover:bg-slate-50"
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
              onClick={() => onFormattingChange({ ...formatting, bold: !formatting.bold })}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold",
                formatting.bold ? "border-[#0C5C57] bg-[#EAF6F3] text-[#0C5C57]" : "border-slate-200 text-slate-600"
              )}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onFormattingChange({ ...formatting, italic: !formatting.italic })}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm italic",
                formatting.italic ? "border-[#0C5C57] bg-[#EAF6F3] text-[#0C5C57]" : "border-slate-200 text-slate-600"
              )}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => onFormattingChange({ ...formatting, underline: !formatting.underline })}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm underline",
                formatting.underline ? "border-[#0C5C57] bg-[#EAF6F3] text-[#0C5C57]" : "border-slate-200 text-slate-600"
              )}
            >
              U
            </button>
            <label className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold">
              <span className="text-[#0C5C57]">A</span>
              <input
                type="color"
                value={formatting.textColor}
                onChange={(event) => onFormattingChange({ ...formatting, textColor: event.target.value })}
                aria-label="Choose text color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-300 p-4">
            <textarea
              value={draftText}
              onChange={(event) => onDraftTextChange(event.target.value)}
              placeholder="What&apos;s on your mind?"
              className={cn(
                "h-[180px] w-full resize-none bg-transparent outline-none placeholder:text-slate-400",
                formatting.fontSize === "small" && "text-sm",
                formatting.fontSize === "medium" && "text-base",
                formatting.fontSize === "large" && "text-lg",
                formatting.bold && "font-semibold",
                formatting.italic && "italic",
                formatting.underline && "underline"
              )}
              style={{ color: formatting.textColor }}
            />
          </div>

          {attachedItems.length ? (
            <div className="mt-4 space-y-2">
              {attachedItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#DCEBE6] bg-[#F8FCFB] px-4 py-3 text-sm text-slate-700">
                  <div className="font-medium text-[#111111]">{item.title}</div>
                  {item.detail ? <div className="mt-1 text-slate-500">{item.detail}</div> : null}
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

          <div className="mt-4 flex items-center justify-between text-slate-500">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChild("photo")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#F1F8F6] hover:text-[#0C5C57]"
            >
              <Images className={ICON} />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChild("emoji")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[#F1F8F6] hover:text-[#0C5C57]"
            >
              <Smile className={ICON} />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-[#E5EFEC] pt-5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onOpenChild("settings")}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#0C5C57]"
            >
              <Settings className={ACTION_ICON} />
              Deet Settings
            </button>

            <button type="submit" disabled={isSubmitting} className={cn(BUTTON_PRIMARY, isSubmitting && "cursor-not-allowed opacity-60")}>
              {isSubmitting ? "Posting" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
