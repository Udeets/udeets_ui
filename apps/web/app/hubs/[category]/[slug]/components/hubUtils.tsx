/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CalendarDays,
  Dumbbell,
  Files,
  Images,
  Landmark,
  Megaphone,
  Plus,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import type { HubFeedItemKind } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";
import type { HubTab } from "./hubTypes";

export const CARD = "rounded-xl border border-slate-100 bg-white shadow-sm";
export const BUTTON_PRIMARY =
  "rounded-full bg-gradient-to-r from-[#0C5C57] to-[#1a8a82] px-4 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:opacity-90";
export const BUTTON_SECONDARY =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-50";
export const ICON = "h-4 w-4 stroke-2";
export const EMPTY_MEDIA_BG = "#A9D1CA";
export const ACTION_ICON = "h-4 w-4 stroke-2";
export const ACTION_ICON_BUTTON = "inline-flex items-center text-[#111111]/78 transition-colors duration-150 hover:text-[#0C5C57]";
export const PREMIUM_ICON_WRAPPER =
  "inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FBFA] text-[#0C5C57]";
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
      className={cn("grid h-full w-full place-items-center text-[#0C5C57]", square ? "aspect-square rounded-2xl" : "")}
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
  return <Files className={ICON} />;
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
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export type CategoryMeta = {
  icon: LucideIcon;
  label: string;
};
