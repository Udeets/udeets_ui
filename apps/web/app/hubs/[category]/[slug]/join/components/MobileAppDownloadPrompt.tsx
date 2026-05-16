"use client";

import { Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, cn } from "../../components/hubUtils";

const STORAGE_KEY = "udeets_app_download_prompt_dismissed";

function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function MobileAppDownloadPrompt() {
  const isMobile = useIsMobileViewport();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!isMobile || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)]/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:hidden"
      role="dialog"
      aria-labelledby="app-download-prompt-title"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-lg p-1 text-[var(--ud-text-muted)] hover:bg-[var(--ud-bg-subtle)]"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-8">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]">
          <Smartphone className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p id="app-download-prompt-title" className="text-sm font-semibold text-[var(--ud-text-primary)]">
            Open in the app
          </p>
          <p className="mt-0.5 text-xs leading-snug text-[var(--ud-text-secondary)]">
            Get the best experience with faster access to hubs, chat, updates, and events.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("udeets:app-download"));
              }}
              className={cn(BUTTON_PRIMARY, "px-3 py-2 text-xs")}
            >
              Download App
            </button>
            <button type="button" onClick={dismiss} className={cn(BUTTON_SECONDARY, "px-3 py-2 text-xs")}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
