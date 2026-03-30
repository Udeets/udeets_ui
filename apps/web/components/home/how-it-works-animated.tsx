"use client";

import { Bell, CalendarDays, ImageIcon, Megaphone, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Step = {
  id: string;
  title: string;
  description: string;
};

type DemoScene = {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  durationMs: number;
};

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

const SCENES: DemoScene[] = [
  {
    id: "create-form",
    step: 0,
    title: "Create a neighborhood hub",
    subtitle: "Set the name, visibility, and category in a guided flow.",
    durationMs: 3200,
  },
  {
    id: "share-post",
    step: 1,
    title: "Share a timely update",
    subtitle: "Publish announcements, photos, and event details from one composer.",
    durationMs: 3200,
  },
  {
    id: "alerts-feed",
    step: 2,
    title: "Stay informed everywhere",
    subtitle: "Followers see alerts, events, and updates in one clean dashboard.",
    durationMs: 3200,
  },
];

const TOTAL_DURATION_MS = SCENES.reduce((sum, scene) => sum + scene.durationMs, 0);
const TICK_MS = 100;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getSceneState(elapsedMs: number) {
  const cycleElapsed = ((elapsedMs % TOTAL_DURATION_MS) + TOTAL_DURATION_MS) % TOTAL_DURATION_MS;
  let cursor = 0;

  for (let index = 0; index < SCENES.length; index += 1) {
    const scene = SCENES[index];
    const nextCursor = cursor + scene.durationMs;
    if (cycleElapsed < nextCursor) {
      return {
        sceneIndex: index,
        scene,
        progressInScene: (cycleElapsed - cursor) / scene.durationMs,
        cycleProgress: cycleElapsed / TOTAL_DURATION_MS,
      };
    }
    cursor = nextCursor;
  }

  return {
    sceneIndex: 0,
    scene: SCENES[0],
    progressInScene: 0,
    cycleProgress: 0,
  };
}

function CreateScene({ progress }: { progress: number }) {
  const filledName = "Kamath Cafe";
  const typedLength = Math.max(1, Math.min(filledName.length, Math.floor(progress * (filledName.length + 3))));
  const typedName = filledName.slice(0, typedLength);
  const categorySelected = progress > 0.46;
  const showSaved = progress > 0.74;

  return (
    <div className="flex h-full flex-col bg-[#F5FAF9]">
      <div className="border-b border-[#DDEBE7] bg-white/95 px-4 py-3.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0C5C57]/70">Create Hub</p>
          <h4 className="mt-1 text-lg font-serif font-semibold tracking-tight text-[#12312D]">Build your community home</h4>
        </div>
      </div>

      <div className="grid flex-1 gap-3.5 p-4">
        <div className="rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hub Name</p>
          <div className="mt-3 rounded-2xl border border-[#D9E8E3] bg-[#FAFCFB] px-4 py-3 text-sm text-[#12312D]">
            {typedName}
            <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-[#0C5C57]/40 align-middle" />
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visibility</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#0C5C57]/20 bg-[#EAF6F3] px-4 py-3 text-sm font-semibold text-[#0C5C57]">
              Public
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#FAFCFB] px-4 py-3 text-sm text-slate-500">Private</div>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Restaurant", "Community", "Temple"].map((item) => (
              <span
                key={item}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium",
                  item === "Restaurant" && categorySelected
                    ? "bg-[#A9D1CA] text-[#0C5C57]"
                    : "border border-slate-200 bg-[#FAFCFB] text-slate-500"
                )}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#DDEBE7] bg-white/95 px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-slate-500">{showSaved ? "Hub prepared successfully" : "Complete setup in seconds"}</div>
          <button
            type="button"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              showSaved ? "bg-[#0C5C57] text-white" : "bg-[#0C5C57] text-white"
            )}
          >
            {showSaved ? "Hub Ready" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShareScene({ progress }: { progress: number }) {
  const message = "Outdoor soccer sessions for Under 12 kids at Twin Hickory ground at 5:00 PM today";
  const typedLength = Math.max(10, Math.min(message.length, Math.floor(progress * (message.length + 10))));
  const typedMessage = message.slice(0, typedLength);
  const showPublished = progress > 0.64;

  return (
    <div className="flex h-full flex-col bg-[#F5FAF9]">
      <div className="border-b border-[#DDEBE7] bg-white/95 px-4 py-3.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0C5C57]/70">Share Updates</p>
          <h4 className="mt-1 text-lg font-serif font-semibold tracking-tight text-[#12312D]">Post one update for everyone</h4>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="rounded-[1.8rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)]">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#A9D1CA] text-sm font-semibold text-[#12312D]">
              SG
            </div>
            <div className="min-w-0 flex-1">
              <div className="rounded-[1.4rem] border border-[#E0ECE8] bg-[#FAFCFB] p-4">
                <p className="text-sm leading-6 text-slate-600">{typedMessage}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF6F3] px-3 py-1.5 text-xs font-medium text-[#0C5C57]">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Photo
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF6F3] px-3 py-1.5 text-xs font-medium text-[#0C5C57]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Event
                  </span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" className="rounded-full bg-[#0C5C57] px-4 py-2 text-sm font-semibold text-white">
                  {showPublished ? "Posted" : "Post Update"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 rounded-[1.6rem] border bg-white p-4 shadow-[0_10px_22px_rgba(12,92,87,0.06)] transition-opacity duration-500",
            showPublished ? "border-[#D9E8E3] opacity-100" : "border-transparent opacity-0"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-[#EAF6F3] p-2 text-[#0C5C57]">
              <Megaphone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#12312D]">Update shared</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Followers now see the announcement in their activity feed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InformScene({ progress }: { progress: number }) {
  const revealAlerts = progress > 0.28;
  const revealEvents = progress > 0.52;
  const revealMembers = progress > 0.72;

  return (
    <div className="flex h-full flex-col bg-[#F5FAF9]">
      <div className="border-b border-[#DDEBE7] bg-white/95 px-4 py-3.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0C5C57]/70">Stay Informed</p>
          <h4 className="mt-1 text-lg font-serif font-semibold tracking-tight text-[#12312D]">Keep every important detail in view</h4>
        </div>
      </div>

      <div className="grid flex-1 gap-3.5 p-4">
        <div className="rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Subscribed hubs</p>
              <p className="mt-1 text-lg font-serif font-semibold text-[#12312D]">Soccer GrassRoot</p>
            </div>
            <span className="rounded-full bg-[#EAF6F3] px-3 py-1 text-xs font-semibold text-[#0C5C57]">Following</span>
          </div>
        </div>

        <div className={cn("rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)] transition-opacity duration-500", revealAlerts ? "opacity-100" : "opacity-35")}>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#EAF6F3] p-2 text-[#0C5C57]">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#12312D]">New alert</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Match-day schedule updated for Twin Hickory ground.</p>
            </div>
          </div>
        </div>

        <div className={cn("rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)] transition-opacity duration-500", revealEvents ? "opacity-100" : "opacity-35")}>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#EAF6F3] p-2 text-[#0C5C57]">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#12312D]">Upcoming event</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Weekend practice opens for RSVP with all details in one place.</p>
            </div>
          </div>
        </div>

        <div className={cn("rounded-[1.6rem] border border-[#D9E8E3] bg-white p-4 shadow-[0_12px_24px_rgba(12,92,87,0.06)] transition-opacity duration-500", revealMembers ? "opacity-100" : "opacity-35")}>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-[#EAF6F3] p-2 text-[#0C5C57]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#12312D]">Members notified</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Subscribers get the same update stream across alerts, events, and posts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoViewport({ sceneIndex, progressInScene }: { sceneIndex: number; progressInScene: number }) {
  return (
    <div className="relative h-full overflow-hidden rounded-[1.6rem] border border-[#A9D1CA]/35 bg-[#F7FBFA]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/65 to-transparent" />
      {sceneIndex === 0 ? <CreateScene progress={progressInScene} /> : null}
      {sceneIndex === 1 ? <ShareScene progress={progressInScene} /> : null}
      {sceneIndex === 2 ? <InformScene progress={progressInScene} /> : null}
    </div>
  );
}

export function HowItWorksAnimated() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [activeDotOffset, setActiveDotOffset] = useState(0);

  const { sceneIndex, scene, progressInScene } = useMemo(() => getSceneState(elapsedMs), [elapsedMs]);
  const activeStep = scene.step;

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeNode = stepRefs.current[activeStep];
    if (!activeNode) return;
    setActiveDotOffset(activeNode.offsetTop + activeNode.offsetHeight / 2 - 6);
  }, [activeStep]);

  useEffect(() => {
    const syncLayout = () => {
      const activeNode = stepRefs.current[activeStep];
      if (!activeNode) return;
      setActiveDotOffset(activeNode.offsetTop + activeNode.offsetHeight / 2 - 6);
    };

    syncLayout();
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, [activeStep]);

  useEffect(() => {
    if (!isVisible) return;

    const interval = window.setInterval(() => {
      setElapsedMs((current) => current + TICK_MS);
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12 lg:px-10">
        <div className="min-w-0">
          <h2 className="flex-none whitespace-nowrap leading-none text-[1.85rem] font-serif font-semibold tracking-tight text-[#111111] sm:text-[2.2rem] lg:text-[2.5rem]">
            How It Works
          </h2>

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

        <div className="min-w-0 lg:flex lg:flex-col lg:self-stretch lg:-translate-y-1">
          <div className="rounded-[2rem] border border-white/90 bg-white/85 p-3 shadow-[0_18px_46px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-4 lg:flex-1 lg:p-3.5">
            <DemoViewport sceneIndex={sceneIndex} progressInScene={progressInScene} />
          </div>
        </div>
      </div>
    </section>
  );
}
