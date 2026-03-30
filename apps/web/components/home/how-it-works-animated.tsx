"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { UdeetsBrandLockup } from "@/components/brand-logo";

type Step = {
  id: string;
  title: string;
  description: string;
};

type CursorState = {
  x: number;
  y: number;
  visible: boolean;
  pressed: boolean;
};

type FocusState = {
  active: boolean;
  x: number;
  y: number;
  scale: number;
};

type BrandScene = "intro" | "outro" | null;

type AnchorType = "button" | "icon" | "input" | "row";

const STEPS: Step[] = [
  {
    id: "create",
    title: "Create a hub",
    description: "Set up a hub for your temple, association, club, restaurant, or community.",
  },
  {
    id: "share",
    title: "Share updates",
    description: "Post announcements, events, offers, media, and important updates in one place.",
  },
  {
    id: "inform",
    title: "Stay informed",
    description: "Subscribe to the hubs you care about and keep up with the deets that matter.",
  },
];

const FRAME_WIDTH = 1440;
const FRAME_HEIGHT = 1600;
const CREATE_HUB_NAME = "Kamath Cafe";
const SHARE_ANNOUNCEMENT =
  "Outdoor soccer sessions for Under 12 kids at Twin Hickory ground at 5:00 PM today";
const CUSTOM_HUB_STORAGE_KEY = "udeets-custom-hubs";

const DISCOVER_URL = "/discover?demo_preview=1";
const CREATE_HUB_URL = "/create-hub?demo_preview=1";
const SHARE_HUB_URL =
  "/hubs/communities/grtava?demo_preview=1&demo_name=Soccer%20GrassRoot&demo_tagline=Soccer%20GrassRoot&demo_description=Local%20youth%20soccer%20updates%2C%20training%20sessions%2C%20and%20match-day%20details%20in%20one%20place.";
const DASHBOARD_URL = "/dashboard?demo_preview=1";
const DASHBOARD_ALERTS_URL = "/dashboard?demo_preview=1&demo_open_panel=alerts";
const MASTER_TIMELINE_TOTAL_MS = 90000;
const CURSOR_TIP_OFFSET_X = 6;
const CURSOR_TIP_OFFSET_Y = 3;
const TARGET_ANCHORS: Partial<Record<string, AnchorType>> = {
  "discover-create-hub": "button",
  "create-hub-name": "input",
  "create-hub-name-next": "button",
  "create-hub-public": "button",
  "create-hub-visibility-next": "button",
  "create-hub-restaurant": "button",
  "create-hub-save": "button",
  "hub-composer-input": "input",
  "hub-composer-post": "button",
  "dashboard-header-alerts": "icon",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeUrlPath(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
}

export function HowItWorksAnimated() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const demoPanelRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const runIdRef = useRef(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const loadedSrcRef = useRef(DISCOVER_URL);
  const cycleStartedAtRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);
  const timelineElapsedRef = useRef(0);
  const timelineActiveRef = useRef(false);

  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [activeDotOffset, setActiveDotOffset] = useState(0);
  const [cycleProgress, setCycleProgress] = useState(0);
  const [previewSrc, setPreviewSrc] = useState(DISCOVER_URL);
  const [panelSize, setPanelSize] = useState({ width: 720, height: 470 });
  const [cursor, setCursor] = useState<CursorState>({ x: 28, y: 40, visible: false, pressed: false });
  const [focus, setFocus] = useState<FocusState>({ active: false, x: 720, y: 420, scale: 1 });
  const [brandScene, setBrandScene] = useState<BrandScene>(null);
  const [brandSceneVisible, setBrandSceneVisible] = useState(false);

  pausedRef.current = !isPlaying;

  const baseScale = useMemo(() => {
    const usableWidth = Math.max(panelSize.width, 360);
    const usableHeight = Math.max(panelSize.height, 260);
    return Math.max(usableWidth / FRAME_WIDTH, usableHeight / FRAME_HEIGHT);
  }, [panelSize.height, panelSize.width]);

  const stageWidth = FRAME_WIDTH * baseScale;
  const stageHeight = FRAME_HEIGHT * baseScale;
  const overflowX = Math.max(0, stageWidth - panelSize.width);
  const overflowY = Math.max(0, stageHeight - panelSize.height);
  const baseOffsetX = overflowX > 0 ? -overflowX / 2 : 0;
  const baseOffsetY = overflowY > 0 ? -overflowY / 2 : 0;
  const focusOffsetX = focus.active
    ? Math.min(0, Math.max(panelSize.width - stageWidth, panelSize.width * 0.7 - focus.x * baseScale))
    : baseOffsetX;
  const focusOffsetY = focus.active
    ? Math.min(0, Math.max(panelSize.height - stageHeight, panelSize.height * 0.18 - focus.y * baseScale))
    : baseOffsetY;
  const stageOffsetX = focusOffsetX;
  const stageOffsetY = focusOffsetY;

  const isCancelled = (runId: number) => runIdRef.current !== runId;

  const wait = async (ms: number, runId: number) => {
    let remaining = ms;

    while (remaining > 0) {
      if (isCancelled(runId)) return false;
      if (pausedRef.current) {
        await new Promise((resolve) => window.setTimeout(resolve, 90));
        continue;
      }

      const slice = Math.min(90, remaining);
      await new Promise((resolve) => window.setTimeout(resolve, slice));
      if (timelineActiveRef.current) {
        timelineElapsedRef.current += slice;
        setCycleProgress(Math.min(0.995, timelineElapsedRef.current / MASTER_TIMELINE_TOTAL_MS));
      }
      remaining -= slice;
    }

    return !isCancelled(runId);
  };

  const syncStepIndicator = (index: number) => {
    const activeNode = stepRefs.current[index];
    if (!activeNode) return;
    setActiveDotOffset(activeNode.offsetTop + activeNode.offsetHeight / 2 - 6);
  };

  const getFrameDocument = () => iframeRef.current?.contentDocument ?? null;

  const getFrameWindow = () => iframeRef.current?.contentWindow ?? null;

  const waitForTarget = async (targetKey: string, runId: number, timeoutMs = 5000) => {
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      if (isCancelled(runId)) return false;
      const doc = getFrameDocument();
      if (doc?.querySelector(`[data-demo-target="${targetKey}"]`)) return true;
      if (!(await wait(100, runId))) return false;
      elapsed += 100;
    }

    return false;
  };

  const waitForRoute = async (expectedRoute: string, runId: number, timeoutMs = 7000) => {
    const normalizedExpected = normalizeUrlPath(expectedRoute);
    let elapsed = 0;

    while (elapsed < timeoutMs) {
      if (isCancelled(runId)) return false;

      const iframeWindow = getFrameWindow();
      const currentPath = iframeWindow ? normalizeUrlPath(iframeWindow.location.href) : loadedSrcRef.current;

      if (currentPath === normalizedExpected) {
        loadedSrcRef.current = currentPath;
        return true;
      }

      if (!(await wait(100, runId))) return false;
      elapsed += 100;
    }

    return false;
  };

  const settleLayout = async (runId: number, frames = 2) => {
    for (let index = 0; index < frames; index += 1) {
      if (isCancelled(runId)) return false;
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }
    return !isCancelled(runId);
  };

  const getDocTargetPoint = (targetKey: string, anchorType?: AnchorType) => {
    const doc = getFrameDocument();
    const target = doc?.querySelector(`[data-demo-target="${targetKey}"]`) as HTMLElement | null;
    if (!target) return null;

    const rect = target.getBoundingClientRect();
    const resolvedAnchor = anchorType ?? TARGET_ANCHORS[targetKey] ?? "button";
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (resolvedAnchor === "icon") {
      return {
        docX: centerX,
        docY: centerY,
      };
    }

    if (resolvedAnchor === "input") {
      return {
        docX: rect.left + Math.min(28, Math.max(18, rect.width * 0.12)),
        docY: centerY,
      };
    }

    if (resolvedAnchor === "row") {
      return {
        docX: rect.left + Math.max(28, rect.width * 0.3),
        docY: centerY,
      };
    }

    return {
      docX: centerX,
      docY: centerY,
    };
  };

  const getTargetMetrics = (targetKey: string) => {
    const targetPoint = getDocTargetPoint(targetKey, TARGET_ANCHORS[targetKey]);
    const panel = demoPanelRef.current;
    const iframe = iframeRef.current;
    const frameWindow = getFrameWindow();
    if (!targetPoint || !panel || !iframe || !frameWindow) return null;

    const iframeRect = iframe.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportWidth = Math.max(frameWindow.innerWidth, 1);
    const viewportHeight = Math.max(frameWindow.innerHeight, 1);

    return {
      docX: targetPoint.docX,
      docY: targetPoint.docY,
      screenX: iframeRect.left - panelRect.left + (targetPoint.docX / viewportWidth) * iframeRect.width,
      screenY: iframeRect.top - panelRect.top + (targetPoint.docY / viewportHeight) * iframeRect.height,
    };
  };

  const showRoute = async (nextRoute: string, runId: number, dwell = 850) => {
    if (isCancelled(runId)) return false;
    setFocus((current) => ({ ...current, active: false, scale: 1 }));
    setPreviewSrc(nextRoute);
    if (!(await waitForRoute(nextRoute, runId))) return false;
    return wait(dwell, runId);
  };

  const moveCursorToTarget = async (targetKey: string, runId: number, duration = 1100) => {
    if (!(await waitForTarget(targetKey, runId))) return false;
    if (!(await settleLayout(runId, 3))) return false;
    const metrics = getTargetMetrics(targetKey);
    if (!metrics || isCancelled(runId)) return false;

    setCursor((current) => ({
      ...current,
      visible: true,
      pressed: false,
      x: metrics.screenX,
      y: metrics.screenY,
    }));

    return wait(duration, runId);
  };

  const focusTarget = async (targetKey: string, runId: number, scale = 1.16, dwell = 680) => {
    if (!(await waitForTarget(targetKey, runId))) return false;
    if (!(await settleLayout(runId, 3))) return false;
    const metrics = getTargetMetrics(targetKey);
    if (!metrics || isCancelled(runId)) return false;

    setFocus({
      active: true,
      x: metrics.docX,
      y: metrics.docY,
      scale,
    });

    return wait(dwell, runId);
  };

  const clearFocus = async (runId: number, dwell = 700) => {
    if (isCancelled(runId)) return false;
    setFocus((current) => ({ ...current, active: false, scale: 1 }));
    return wait(dwell, runId);
  };

  const fireFrameClick = (targetKey: string) => {
    const target = getFrameDocument()?.querySelector(`[data-demo-target="${targetKey}"]`) as HTMLElement | null;
    const frameWindow = getFrameWindow() as (Window & typeof globalThis) | null;
    if (!target || !frameWindow) return;

    const pointerInit = { bubbles: true, cancelable: true, view: frameWindow };
    target.dispatchEvent(new frameWindow.MouseEvent("pointerdown", pointerInit));
    target.dispatchEvent(new frameWindow.MouseEvent("mousedown", pointerInit));
    target.dispatchEvent(new frameWindow.MouseEvent("mouseup", pointerInit));

    if (target instanceof frameWindow.HTMLAnchorElement && target.href) {
      frameWindow.location.assign(target.href);
      return;
    }

    target.click();
  };

  const clickTarget = async (
    targetKey: string,
    runId: number,
    options?: {
      focusTargetKey?: string;
      moveDuration?: number;
      focusScale?: number;
      focusDwell?: number;
      pressDuration?: number;
      releaseBuffer?: number;
      afterClickWait?: number;
    }
  ) => {
    const moveDuration = options?.moveDuration ?? 1100;
    const focusTargetKey = options?.focusTargetKey ?? targetKey;
    const focusScale = options?.focusScale ?? 1.16;
    const focusDwell = options?.focusDwell ?? 680;
    const pressDuration = options?.pressDuration ?? 180;
    const releaseBuffer = options?.releaseBuffer ?? 220;
    const afterClickWait = options?.afterClickWait ?? 320;

    if (!(await focusTarget(focusTargetKey, runId, focusScale, focusDwell))) return false;
    if (!(await settleLayout(runId, 3))) return false;
    if (!(await moveCursorToTarget(targetKey, runId, moveDuration))) return false;
    if (isCancelled(runId)) return false;

    setCursor((current) => ({ ...current, pressed: true, visible: true }));
    if (!(await wait(pressDuration, runId))) return false;
    fireFrameClick(targetKey);
    setCursor((current) => ({ ...current, pressed: false }));

    if (!(await wait(releaseBuffer, runId))) return false;
    return wait(afterClickWait, runId);
  };

  const setFrameFieldValue = (targetKey: string, value: string) => {
    const frameWindow = getFrameWindow() as (Window & typeof globalThis) | null;
    const target = getFrameDocument()?.querySelector(`[data-demo-target="${targetKey}"]`) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;

    if (!frameWindow || !target) return false;

    const isTextArea = target instanceof frameWindow.HTMLTextAreaElement;
    const prototype = isTextArea ? frameWindow.HTMLTextAreaElement.prototype : frameWindow.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    descriptor?.set?.call(target, value);
    target.dispatchEvent(new frameWindow.Event("input", { bubbles: true }));
    return true;
  };

  const typeIntoTarget = async (targetKey: string, text: string, runId: number, speed = 56) => {
    if (!(await waitForTarget(targetKey, runId))) return false;
    if (!(await settleLayout(runId, 3))) return false;

    for (let index = 1; index <= text.length; index += 1) {
      if (isCancelled(runId)) return false;
      setFrameFieldValue(targetKey, text.slice(0, index));
      if (!(await wait(speed, runId))) return false;
    }

    return true;
  };

  const focusAreaThenAct = async (
    focusTargetKey: string,
    runId: number,
    options?: {
      scale?: number;
      dwell?: number;
      hold?: number;
    }
  ) => {
    if (!(await focusTarget(focusTargetKey, runId, options?.scale ?? 1.42, options?.dwell ?? 760))) return false;
    return wait(options?.hold ?? 520, runId);
  };

  const runBrandedOutro = async (runId: number) => {
    setCursor((current) => ({ ...current, visible: false, pressed: false }));
    setCycleProgress(1);
    if (!(await showBrandScene("outro", runId))) return false;
    if (!(await wait(5000, runId))) return false;
    if (!(await hideBrandScene(runId))) return false;
    return wait(180, runId);
  };

  const activateStep = async (index: number, runId: number) => {
    if (isCancelled(runId)) return false;
    setActiveStep(index);
    syncStepIndicator(index);
    return wait(260, runId);
  };

  const showBrandScene = async (scene: Exclude<BrandScene, null>, runId: number) => {
    if (isCancelled(runId)) return false;
    setCursor((current) => ({ ...current, visible: false, pressed: false }));
    setFocus({ active: false, x: FRAME_WIDTH / 2, y: FRAME_HEIGHT / 2, scale: 1 });
    setBrandScene(scene);
    setBrandSceneVisible(false);
    if (!(await wait(220, runId))) return false;
    setBrandSceneVisible(true);
    return wait(1200, runId);
  };

  const hideBrandScene = async (runId: number) => {
    if (isCancelled(runId)) return false;
    setBrandSceneVisible(false);
    if (!(await wait(420, runId))) return false;
    setBrandScene(null);
    return wait(120, runId);
  };

  const resetDemo = () => {
    window.localStorage.removeItem(CUSTOM_HUB_STORAGE_KEY);
    setActiveStep(0);
    syncStepIndicator(0);
    setCycleProgress(0);
    timelineElapsedRef.current = 0;
    timelineActiveRef.current = false;
    setPreviewSrc(DISCOVER_URL);
    loadedSrcRef.current = DISCOVER_URL;
    setCursor({ x: 28, y: 40, visible: false, pressed: false });
    setFocus({ active: false, x: FRAME_WIDTH / 2, y: FRAME_HEIGHT / 2, scale: 1 });
    setBrandScene(null);
    setBrandSceneVisible(false);
  };

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncLayout = () => syncStepIndicator(activeStep);
    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, [activeStep]);

  useEffect(() => {
    if (isPlaying) {
      if (pausedAtRef.current) {
        pausedDurationRef.current += performance.now() - pausedAtRef.current;
        pausedAtRef.current = null;
      }
    } else if (!pausedAtRef.current) {
      pausedAtRef.current = performance.now();
    }
  }, [isPlaying]);

  useEffect(() => {
    const node = demoPanelRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const next = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };
      setPanelSize(next);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const runDemoLoop = useEffectEvent(async (runId: number) => {
    try {
      while (!isCancelled(runId)) {
        resetDemo();
        cycleStartedAtRef.current = performance.now();
        pausedDurationRef.current = 0;
        pausedAtRef.current = null;
        timelineActiveRef.current = true;
        if (!(await showBrandScene("intro", runId))) return;
        if (!(await showRoute(DISCOVER_URL, runId, 680))) return;
        if (!(await hideBrandScene(runId))) return;
        if (!(await wait(760, runId))) return;

        if (!(await activateStep(0, runId))) return;
        if (!(await wait(950, runId))) return;
        if (
          !(await clickTarget("discover-create-hub", runId, {
            moveDuration: 1250,
            focusScale: 1.38,
            focusDwell: 720,
            afterClickWait: 500,
          }))
        ) {
          return;
        }

        if (!(await waitForRoute(CREATE_HUB_URL, runId))) return;
        if (!(await wait(1200, runId))) return;
        if (!(await focusAreaThenAct("create-hub-name-section", runId, { scale: 2.08, dwell: 980, hold: 420 }))) return;
        if (
          !(await clickTarget("create-hub-name", runId, {
            focusTargetKey: "create-hub-name-section",
            moveDuration: 1100,
            focusScale: 2.08,
            focusDwell: 520,
            afterClickWait: 280,
          }))
        ) {
          return;
        }
        if (!(await typeIntoTarget("create-hub-name", CREATE_HUB_NAME, runId, 58))) return;
        if (!(await wait(1000, runId))) return;
        if (!(await clearFocus(runId, 760))) return;
        if (!(await wait(520, runId))) return;

        if (!(await clickTarget("create-hub-name-next", runId, { moveDuration: 980, focusScale: 2.18, focusDwell: 560 }))) return;
        if (!(await wait(920, runId))) return;

        if (!(await focusAreaThenAct("create-hub-visibility-section", runId, { scale: 2.02, dwell: 980, hold: 420 }))) return;
        if (
          !(await clickTarget("create-hub-public", runId, {
            moveDuration: 1080,
            focusScale: 2.24,
            focusDwell: 560,
            afterClickWait: 360,
          }))
        ) {
          return;
        }
        if (!(await wait(420, runId))) return;
        if (
          !(await clickTarget("create-hub-visibility-next", runId, {
            moveDuration: 980,
            focusScale: 2.18,
            focusDwell: 520,
          }))
        ) {
          return;
        }
        if (!(await clearFocus(runId, 760))) return;
        if (!(await wait(1200, runId))) return;

        if (!(await focusAreaThenAct("create-hub-category-section", runId, { scale: 1.98, dwell: 980, hold: 420 }))) return;
        if (
          !(await clickTarget("create-hub-restaurant", runId, {
            moveDuration: 1080,
            focusScale: 2.18,
            focusDwell: 560,
            afterClickWait: 360,
          }))
        ) {
          return;
        }
        if (!(await wait(420, runId))) return;
        if (
          !(await clickTarget("create-hub-save", runId, {
            moveDuration: 980,
            focusScale: 2.2,
            focusDwell: 540,
            afterClickWait: 520,
          }))
        ) {
          return;
        }

        if (!(await waitForRoute("/hubs/restaurants/kamath-cafe?demo_preview=1", runId))) return;
        if (!(await clearFocus(runId, 900))) return;
        if (!(await wait(1800, runId))) return;

        if (!(await activateStep(1, runId))) return;
        if (!(await showRoute(SHARE_HUB_URL, runId, 1400))) return;
        if (!(await wait(900, runId))) return;
        if (!(await focusAreaThenAct("hub-composer-section", runId, { scale: 1.78, dwell: 900, hold: 360 }))) return;
        if (
          !(await clickTarget("hub-composer-input", runId, {
            focusTargetKey: "hub-composer-section",
            moveDuration: 1200,
            focusScale: 1.78,
            focusDwell: 500,
          }))
        ) {
          return;
        }
        if (!(await typeIntoTarget("hub-composer-input", SHARE_ANNOUNCEMENT, runId, 48))) return;
        if (!(await wait(950, runId))) return;
        if (
          !(await clickTarget("hub-composer-post", runId, {
            moveDuration: 1000,
            focusScale: 2.16,
            focusDwell: 520,
          }))
        ) {
          return;
        }

        if (
          !(await showRoute(
            `${SHARE_HUB_URL}&demo_composer=${encodeURIComponent(SHARE_ANNOUNCEMENT)}&demo_posted=${encodeURIComponent(
              SHARE_ANNOUNCEMENT
            )}`,
            runId,
            1200
          ))
        ) {
          return;
        }
        if (!(await clearFocus(runId, 900))) return;
        if (!(await wait(1800, runId))) return;

        if (!(await activateStep(2, runId))) return;
        if (!(await showRoute(DASHBOARD_URL, runId, 1400))) return;
        if (!(await wait(900, runId))) return;
        if (!(await focusAreaThenAct("dashboard-header-alerts", runId, { scale: 2.55, dwell: 980, hold: 320 }))) return;
        if (
          !(await clickTarget("dashboard-header-alerts", runId, {
            moveDuration: 1250,
            focusScale: 2.82,
            focusDwell: 760,
            afterClickWait: 420,
          }))
        ) {
          return;
        }
        if (!(await clearFocus(runId, 620))) return;
        if (!(await wait(320, runId))) return;
        if (!(await showRoute(DASHBOARD_ALERTS_URL, runId, 900))) return;
        if (!(await focusAreaThenAct("dashboard-alerts-dropdown", runId, { scale: 2.18, dwell: 920, hold: 2000 }))) return;
        if (!(await clearFocus(runId, 720))) return;
        if (!(await runBrandedOutro(runId))) return;
      }
    } finally {
      timelineActiveRef.current = false;
      runningRef.current = false;
    }
  });

  useEffect(() => {
    if (!isVisible || !isPlaying || runningRef.current) return;

    const runId = ++runIdRef.current;
    runningRef.current = true;
    void runDemoLoop(runId);

    return () => {
      runIdRef.current += 1;
      runningRef.current = false;
    };
  }, [isVisible, isPlaying]);

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12 lg:px-10">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex-none whitespace-nowrap leading-none text-[1.85rem] font-serif font-semibold tracking-tight text-[#111111] sm:text-[2.2rem] lg:text-[2.5rem]">
              How It Works
            </h2>
            <div className="ml-auto flex w-[10.75rem] flex-none items-center gap-2 sm:w-[12.5rem]">
              <button
                type="button"
                aria-label={isPlaying ? "Pause demo" : "Play demo"}
                onClick={() => setIsPlaying((current) => !current)}
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition",
                  isPlaying
                    ? "border-[#0C5C57]/25 bg-[#0C5C57] text-white shadow-[0_0_0_4px_rgba(169,209,202,0.24),0_10px_20px_rgba(12,92,87,0.16)]"
                    : "border-[#A9D1CA]/80 bg-white text-[#0C5C57] hover:bg-[#F7FBFA]"
                )}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              </button>
              <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#D8ECE8]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#0C5C57] shadow-[0_0_18px_rgba(12,92,87,0.28)] transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.max(0, Math.min(100, cycleProgress * 100))}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Create, share, and stay connected through a simple hub experience.
          </p>

          <div className="relative mt-10 space-y-4 pl-8">
            <div className="absolute bottom-3 left-3 top-3 w-px bg-[#A9D1CA]/80" />
            <div
              className="absolute left-[7px] h-3 w-3 rounded-full border-2 border-white bg-[#0C5C57] shadow-[0_0_0_6px_rgba(12,92,87,0.12)] transition-transform duration-500 ease-out"
              style={{ transform: `translateY(${activeDotOffset}px)` }}
            />
            {STEPS.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <article
                  key={step.id}
                  ref={(node) => {
                    stepRefs.current[index] = node;
                  }}
                  className={cn(
                    "rounded-[1.75rem] border bg-white/88 p-5 shadow-[0_14px_35px_rgba(15,23,42,0.06)] transition-all duration-500 ease-out sm:p-6",
                    isActive
                      ? "scale-[1.018] border-[#0C5C57]/35 shadow-[0_22px_46px_rgba(12,92,87,0.14),0_0_0_1px_rgba(169,209,202,0.45)]"
                      : "border-slate-200/70 opacity-75"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold transition-colors duration-500",
                        isActive
                          ? "border-[#0C5C57]/20 bg-[#0C5C57] text-white shadow-[0_0_0_8px_rgba(169,209,202,0.3),0_12px_28px_rgba(12,92,87,0.16)]"
                          : "border-[#A9D1CA]/70 bg-[#EAF6F3] text-[#0C5C57]"
                      )}
                    >
                      0{index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-serif font-semibold tracking-tight text-[#111111]">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-[15px]">{step.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="min-w-0">
          <div className="rounded-[2rem] border border-white/90 bg-white/85 p-3 shadow-[0_18px_46px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-4">
            <div className="overflow-hidden rounded-[1.6rem] border border-[#A9D1CA]/35 bg-[#F7FBFA]">
              <div ref={demoPanelRef} className="relative min-h-[620px] overflow-hidden bg-[#F5FAF9] sm:min-h-[700px]">
                <div
                  className="absolute transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    left: stageOffsetX,
                    top: stageOffsetY,
                    width: stageWidth,
                    height: stageHeight,
                  }}
                >
                  <div
                    className="relative overflow-hidden"
                    style={{
                      width: FRAME_WIDTH,
                      height: FRAME_HEIGHT,
                      transform: `scale(${baseScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <div
                      className="fade-in-panel relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        transform: `scale(${focus.active ? focus.scale : 1})`,
                        transformOrigin: `${focus.x}px ${focus.y}px`,
                      }}
                    >
                      <iframe
                        ref={iframeRef}
                        src={previewSrc}
                        title="uDeets live demo preview"
                        className="pointer-events-none h-full w-full border-0 bg-white"
                      />
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-0 transition-opacity duration-500",
                          focus.active ? "opacity-100" : "opacity-0"
                        )}
                      >
                        <div className="absolute inset-0 bg-black/[0.02]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-0 z-[80] hidden sm:block">
                  <div
                    className={cn(
                      "absolute left-0 top-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                      cursor.visible ? "opacity-100" : "opacity-0"
                    )}
                    style={{
                      transform: `translate3d(${cursor.x - CURSOR_TIP_OFFSET_X}px, ${cursor.y - CURSOR_TIP_OFFSET_Y}px, 0)`,
                    }}
                  >
                    <span className="relative block">
                      <svg
                        viewBox="0 0 26 31"
                        className="relative h-9 w-9 drop-shadow-[0_10px_24px_rgba(12,92,87,0.22)]"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M4.024 2.344 19.88 18.2l-6.948 1.446 3.324 8.03-3.55 1.471-3.326-8.03-5.357 4.663V2.344Z"
                          fill="#0C5C57"
                        />
                        <path
                          d="M4.024 2.344 19.88 18.2l-6.948 1.446 3.324 8.03-3.55 1.471-3.326-8.03-5.357 4.663V2.344Z"
                          stroke="#D8ECE8"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                {brandScene ? (
                  <div
                    className={cn(
                      "absolute inset-0 z-[75] flex items-center justify-center bg-[#F5FAF9] transition-opacity duration-500",
                      brandSceneVisible ? "opacity-100" : "opacity-0"
                    )}
                  >
                    <div
                      className={cn(
                        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        brandSceneVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.96] opacity-0"
                      )}
                    >
                      <UdeetsBrandLockup
                        className="items-center"
                        logoClassName="h-16 w-16 sm:h-20 sm:w-20"
                        textClassName="text-4xl sm:text-5xl"
                        priority
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
