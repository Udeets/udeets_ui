"use client";

import { ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "../../hubUtils";

export type ComposerMenuSelectOption = { value: string; label: string };

const MENU_Z = 220;

/**
 * Hub-feed style menu (same look as Newest / Oldest in `DeetsSection`).
 * Renders the list in a `fixed` portal so it is not clipped by the composer modal `overflow-y-auto`.
 */
export function ComposerMenuSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select…",
  className,
  alignMenu = "left",
  menuMinWidthPx = 160,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly ComposerMenuSelectOption[] | ComposerMenuSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  alignMenu?: "left" | "right";
  menuMinWidthPx?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(r.width, menuMinWidthPx);
    const left =
      alignMenu === "right" ? Math.max(8, r.right - w) : Math.min(r.left, Math.max(8, window.innerWidth - w - 8));
    // Always open below the trigger (matches feed sort UX). Flipping above was confusing
    // for controls near the bottom of the composer (e.g. Sort options).
    const spaceBelow = Math.max(0, window.innerHeight - r.bottom - 12);
    const maxH = Math.min(280, spaceBelow > 0 ? spaceBelow : 200);
    const top = r.bottom + 4;
    setMenuBox({ top, left, width: w, maxHeight: maxH });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuBox(null);
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, alignMenu, menuMinWidthPx]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      const node = ev.target as Node;
      if (triggerRef.current?.contains(node)) return;
      if (menuRef.current?.contains(node)) return;
      setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && menuBox && mounted ? (
      <div
        ref={menuRef}
        id={listId}
        role="listbox"
        style={{
          position: "fixed",
          top: menuBox.top,
          left: menuBox.left,
          width: menuBox.width,
          maxHeight: menuBox.maxHeight,
          zIndex: MENU_Z,
        }}
        className="overflow-y-auto rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={value === opt.value}
            onClick={() => {
              onChange(opt.value);
              setOpen(false);
            }}
            className={cn(
              "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition",
              value === opt.value
                ? "bg-[var(--ud-brand-light)] font-medium text-[var(--ud-brand-primary)]"
                : "text-[var(--ud-text-secondary)] hover:bg-[var(--ud-bg-subtle)]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className={cn("relative min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3.5 text-left text-sm font-medium text-[var(--ud-text-primary)] shadow-sm transition hover:border-[var(--ud-border-focus)]",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[var(--ud-text-muted)] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
