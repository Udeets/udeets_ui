/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  DollarSign,
  Dumbbell,
  Files,
  Images,
  Landmark,
  Megaphone,
  Newspaper,
  Plus,
  ShieldAlert,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import type { HubFeedItemKind } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";
import type { HubTab } from "./hubTypes";

export const CARD = "rounded-xl border border-[var(--ud-border-subtle)] bg-[var(--ud-bg-card)] shadow-sm";
export const BUTTON_PRIMARY =
  "rounded-full bg-gradient-to-r from-[var(--ud-gradient-from)] to-[var(--ud-gradient-to)] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:opacity-90";
export const BUTTON_SECONDARY =
  "rounded-full border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-4 py-2 text-xs font-semibold text-[var(--ud-text-primary)] transition-colors duration-150 hover:bg-[var(--ud-bg-subtle)]";
export const ICON = "h-[18px] w-[18px] stroke-[1.5]";
export const EMPTY_MEDIA_BG = "#A9D1CA";
export const ACTION_ICON = "h-5 w-5 stroke-[1.5]";
export const ACTION_ICON_BUTTON = "inline-flex items-center text-[var(--ud-text-primary)]/78 transition-colors duration-150 hover:text-[var(--ud-brand-primary)]";
export const PREMIUM_ICON_WRAPPER =
  "inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ud-brand-light)] text-[var(--ud-brand-primary)]";
export const INPUT_CLASS = "w-full rounded-xl border border-[var(--ud-border)] bg-[var(--ud-bg-input)] px-4 py-2.5 text-sm text-[var(--ud-text-primary)] outline-none transition-colors focus:border-[var(--ud-border-focus)]";
export const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]";
export const SECTION_TITLE = "text-lg font-semibold text-[var(--ud-text-primary)]";
export const HUB_TABS: HubTab[] = ["About", "Posts", "Attachments", "Members"];

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizePublicSrc(src?: string) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

export function compactId(value?: string) {
  if (!value) return "";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function displayLinkValue(value?: string) {
  if (!value) return "";
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function MediaEmptyState({ square = false }: { square?: boolean }) {
  return (
    <div
      className={cn("grid h-full w-full place-items-center text-[var(--ud-brand-primary)]", square ? "aspect-square rounded-2xl" : "")}
      style={{ backgroundColor: EMPTY_MEDIA_BG }}
    >
      <Plus className="h-9 w-9 stroke-[1.9] text-white/75" />
    </div>
  );
}

export function categoryMetaFor(category: HubRecord["category"]) {
  if (category === "restaurants") return { icon: UtensilsCrossed, label: "Restaurant" };
  if (category === "religious-places") return { icon: Landmark, label: "Religious Place" };
  if (category === "fitness") return { icon: Dumbbell, label: "Fitness" };
  if (category === "pet-clubs") return { icon: Building2, label: "Pet Club" };
  if (category === "hoa") return { icon: Building2, label: "HOA" };
  return { icon: UsersRound, label: "Community" };
}

export function ImageWithFallback({
  src,
  sources,
  alt,
  className,
  fallbackClassName,
  fallback,
  loading,
  fallbackStyle,
}: {
  src?: string;
  sources?: string[];
  alt: string;
  className: string;
  fallbackClassName: string;
  fallback: React.ReactNode;
  loading?: "lazy" | "eager";
  fallbackStyle?: React.CSSProperties;
}) {
  const normalizedSources = useMemo(
    () => Array.from(new Set((sources?.length ? sources : [src]).filter(Boolean))) as string[],
    [sources, src]
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const activeSrc = normalizedSources[sourceIndex] ?? normalizedSources[0];

  if (!activeSrc) {
    return <div className={fallbackClassName} style={fallbackStyle}>{fallback}</div>;
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}

export function FeedItemIcon({ kind }: { kind: HubFeedItemKind }) {
  if (kind === "announcement") return <Megaphone className={ICON} />;
  if (kind === "photo") return <Images className={ICON} />;
  if (kind === "notice") return <Bell className={ICON} />;
  if (kind === "event") return <CalendarDays className={ICON} />;
  if (kind === "news") return <Newspaper className={ICON} />;
  if (kind === "deal") return <DollarSign className={ICON} />;
  if (kind === "hazard") return <AlertTriangle className={ICON} />;
  if (kind === "alert") return <ShieldAlert className={ICON} />;
  if (kind === "jobs") return <Briefcase className={ICON} />;
  return <Files className={ICON} />;
}

/** Band-style badge colors and labels for each post kind */
export function feedKindMeta(kind: HubFeedItemKind): { label: string; badgeClass: string } {
  switch (kind) {
    case "announcement":
      return { label: "Announcement", badgeClass: "bg-orange-50 text-orange-600 border-orange-200" };
    case "notice":
      return { label: "Notice", badgeClass: "bg-blue-50 text-blue-600 border-blue-200" };
    case "photo":
      return { label: "Photo", badgeClass: "bg-emerald-50 text-emerald-600 border-emerald-200" };
    case "event":
      return { label: "Event", badgeClass: "bg-purple-50 text-purple-600 border-purple-200" };
    case "news":
      return { label: "News", badgeClass: "bg-sky-50 text-sky-600 border-sky-200" };
    case "deal":
      return { label: "Deal", badgeClass: "bg-amber-50 text-amber-600 border-amber-200" };
    case "hazard":
      return { label: "Hazard", badgeClass: "bg-red-50 text-red-600 border-red-200" };
    case "alert":
      return { label: "Alert", badgeClass: "bg-red-50 text-red-600 border-red-200" };
    case "jobs":
      return { label: "Jobs", badgeClass: "bg-indigo-50 text-indigo-600 border-indigo-200" };
    default:
      return { label: "Post", badgeClass: "bg-gray-50 text-gray-600 border-gray-200" };
  }
}

export function SettingField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ud-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

export type CategoryMeta = {
  icon: LucideIcon;
  label: string;
};
