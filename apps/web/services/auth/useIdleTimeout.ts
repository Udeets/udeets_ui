"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks user activity and signs the user out after a period of inactivity.
 *
 * Behavior:
 *   - Listens for mouse/keyboard/touch/scroll events to reset an activity timer.
 *   - Syncs "last activity" across browser tabs via localStorage so a busy tab
 *     keeps an idle tab logged in.
 *   - Ignores activity while the tab is hidden (so background tabs don't keep
 *     the session alive indefinitely — the clock still ticks).
 *   - Before signing the user out, opens a warning dialog for `warningDurationMs`
 *     so the user can click "Stay signed in" to reset the timer.
 *
 * Defaults match common app norms: 30 min idle → 60 sec warning → sign out.
 */
export type IdleTimeoutConfig = {
  /** Total idle time before the warning appears. Default 30 minutes. */
  idleTimeoutMs?: number;
  /** How long the warning shows before the auto sign-out. Default 60 seconds. */
  warningDurationMs?: number;
  /** Called when the user is signed out due to inactivity. */
  onIdleSignOut?: () => void | Promise<void>;
  /** Disable everything (e.g. when the user isn't signed in yet). */
  enabled?: boolean;
};

const STORAGE_KEY = "udeets:last-activity";
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
];

export type IdleTimeoutState = {
  /** True while the "you're about to be signed out" warning is open. */
  isWarningOpen: boolean;
  /** Seconds left before sign-out once the warning is showing. */
  secondsUntilSignOut: number;
  /** Call from a "Stay signed in" button to reset the idle timer. */
  stayActive: () => void;
};

export function useIdleTimeout({
  idleTimeoutMs = 30 * 60 * 1000,
  warningDurationMs = 60 * 1000,
  onIdleSignOut,
  enabled = true,
}: IdleTimeoutConfig = {}): IdleTimeoutState {
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsUntilSignOut, setSecondsUntilSignOut] = useState(Math.ceil(warningDurationMs / 1000));

  // Refs so the recurring interval doesn't restart on every render.
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onIdleSignOutRef = useRef(onIdleSignOut);

  useEffect(() => { onIdleSignOutRef.current = onIdleSignOut; }, [onIdleSignOut]);

  const writeLastActivity = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* private mode / disabled storage */
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    if (signOutTimerRef.current) { clearTimeout(signOutTimerRef.current); signOutTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  }, []);

  const scheduleTimers = useCallback(() => {
    clearAllTimers();
    // Warning fires `warningDurationMs` before the actual sign-out.
    const timeUntilWarning = Math.max(0, idleTimeoutMs - warningDurationMs);

    warningTimerRef.current = setTimeout(() => {
      setIsWarningOpen(true);
      setSecondsUntilSignOut(Math.ceil(warningDurationMs / 1000));

      // Live countdown for the warning banner.
      countdownIntervalRef.current = setInterval(() => {
        setSecondsUntilSignOut((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // Auto sign-out at the end of the warning window.
      signOutTimerRef.current = setTimeout(async () => {
        clearAllTimers();
        setIsWarningOpen(false);
        try {
          await onIdleSignOutRef.current?.();
        } catch (err) {
          console.error("[useIdleTimeout] sign-out callback failed:", err);
        }
      }, warningDurationMs);
    }, timeUntilWarning);
  }, [idleTimeoutMs, warningDurationMs, clearAllTimers]);

  const recordActivity = useCallback(() => {
    if (!enabled) return;
    // If the warning is currently up, don't silently dismiss it — the user
    // needs to click "Stay signed in" explicitly so we don't swallow their
    // attempt to click sign-out.
    if (isWarningOpen) return;
    writeLastActivity();
    scheduleTimers();
  }, [enabled, isWarningOpen, writeLastActivity, scheduleTimers]);

  const stayActive = useCallback(() => {
    setIsWarningOpen(false);
    writeLastActivity();
    scheduleTimers();
  }, [writeLastActivity, scheduleTimers]);

  // Main wiring: listen for user activity + cross-tab sync + visibility.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Seed the timer and the last-activity marker.
    writeLastActivity();
    scheduleTimers();

    // Throttle DOM activity events so mousemove doesn't spam rescheduling.
    let lastHandled = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastHandled < 1000) return;
      lastHandled = now;
      recordActivity();
    };

    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Cross-tab sync: if another tab recorded activity, treat that as our own.
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        scheduleTimers();
        if (isWarningOpen) setIsWarningOpen(false);
      }
    };
    window.addEventListener("storage", handleStorage);

    // When the tab becomes visible again, reconcile with the last known activity.
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const rawLast = Number(localStorage.getItem(STORAGE_KEY) || "0");
      if (!rawLast) {
        scheduleTimers();
        return;
      }
      const idleFor = Date.now() - rawLast;
      if (idleFor >= idleTimeoutMs) {
        // Already over the threshold — go straight to the warning (or sign out).
        clearAllTimers();
        setIsWarningOpen(true);
        setSecondsUntilSignOut(0);
        onIdleSignOutRef.current?.();
      } else {
        scheduleTimers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handleActivity));
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearAllTimers();
    };
  }, [enabled, recordActivity, scheduleTimers, writeLastActivity, clearAllTimers, idleTimeoutMs, isWarningOpen]);

  return { isWarningOpen, secondsUntilSignOut, stayActive };
}
