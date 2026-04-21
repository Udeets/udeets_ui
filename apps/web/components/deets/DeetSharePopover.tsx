"use client";

import { Check, Copy, Link2, Mail, Share2 } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type DeetSharePopoverProps = {
  shareUrl: string;
  title: string;
  deetId: string;
  /** Optional analytics when the user completes a share or copy action. */
  onRecordShare?: (deetId: string) => void;
  onCopySuccess?: () => void;
  copied?: boolean;
  triggerClassName?: string;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function openCenteredWindow(url: string, name: string) {
  const w = 580;
  const h = 420;
  const y = window.top?.outerHeight ? (window.top.outerHeight - h) / 2 + (window.top.screenY ?? 0) : 0;
  const x = window.top?.outerWidth ? (window.top.outerWidth - w) / 2 + (window.top.screenX ?? 0) : 0;
  window.open(url, name, `noopener,noreferrer,width=${w},height=${h},left=${x},top=${y}`);
}

export function DeetSharePopover({
  shareUrl,
  title,
  deetId,
  onRecordShare,
  onCopySuccess,
  copied,
  triggerClassName,
}: DeetSharePopoverProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"below" | "above">("below");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const record = useCallback(() => {
    onRecordShare?.(deetId);
  }, [deetId, onRecordShare]);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;
    const el = wrapRef.current;
    const id = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const minSpace = 280;
      if (spaceBelow >= minSpace || spaceBelow >= spaceAbove) {
        setPlacement("below");
      } else {
        setPlacement("above");
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title, text: title, url: shareUrl });
      record();
      setOpen(false);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        /* ignore */
      }
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(shareUrl);
    if (ok) {
      onCopySuccess?.();
      record();
      setOpen(false);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title || "Post from UDeets");
    const body = encodeURIComponent(`${title}\n\n${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    record();
    setOpen(false);
  };

  const handleFacebook = () => {
    openCenteredWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "fb-share",
    );
    record();
    setOpen(false);
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(title ? `${title} ${shareUrl}` : shareUrl);
    openCenteredWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${text}`, "x-share");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative flex flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "flex w-full items-center justify-center gap-1.5 py-2.5 text-sm transition-colors hover:bg-[var(--ud-bg-subtle)]",
          copied ? "font-medium text-[var(--ud-brand-primary)]" : "text-[var(--ud-text-muted)]",
          triggerClassName,
        )}
      >
        {copied ? <Check className="h-[18px] w-[18px] stroke-[1.5]" /> : <Share2 className="h-[18px] w-[18px] stroke-[1.5]" />}
        <span>{copied ? "Copied!" : "Share"}</span>
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-40 w-[min(100vw-2rem,260px)] rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-card)] p-1.5 shadow-lg sm:left-auto sm:right-0 sm:translate-x-0",
            placement === "below"
              ? "left-1/2 top-full mt-1 -translate-x-1/2 sm:translate-x-0"
              : "bottom-full left-1/2 mb-1 -translate-x-1/2 sm:translate-x-0",
          )}
        >
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
            Share this post
          </p>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              Share via…
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            <Copy className="h-4 w-4 shrink-0" />
            Copy link
          </button>
          <button
            type="button"
            onClick={handleEmail}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            <Mail className="h-4 w-4 shrink-0" />
            Email
          </button>
          <button
            type="button"
            onClick={handleFacebook}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            Facebook
          </button>
          <button
            type="button"
            onClick={handleTwitter}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--ud-text-secondary)] transition hover:bg-[var(--ud-bg-subtle)]"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            X (Twitter)
          </button>
          <p className="px-2 py-1.5 text-[10px] leading-snug text-[var(--ud-text-muted)]">
            Instagram has no web share URL for arbitrary links—use Copy link and paste in the app.
          </p>
        </div>
      ) : null}
    </div>
  );
}
