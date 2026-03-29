"use client";

import type { HubFeedItem } from "@/lib/hub-content";

const DEETS_STORAGE_KEY = "udeets-shared-deets";
const DEETS_STORAGE_EVENT = "udeets-shared-deets-change";

export type StoredDeetKind = "Posts" | "Notices" | "Photos";

export type StoredDeetAttachment = {
  type: string;
  title: string;
  detail?: string;
  previews?: string[];
  previewUrl?: string;
  image?: string;
  imageUrl?: string;
  url?: string;
  src?: string;
};

export type StoredDeet = {
  id: string;
  hubId: string;
  hubSlug: string;
  hubHref: string;
  hubName: string;
  category: string;
  authorName: string;
  title: string;
  body: string;
  kind: StoredDeetKind;
  createdAt: string;
  previewImage?: string;
  image?: string;
  attachments: StoredDeetAttachment[];
};

export type CreateStoredDeetInput = Omit<StoredDeet, "id" | "createdAt">;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sortNewestFirst(items: StoredDeet[]) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function asImageString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "";
}

function firstImageString(...values: unknown[]) {
  for (const value of values) {
    const normalized = asImageString(value);
    if (normalized) return normalized;
  }

  return "";
}

function normalizeAttachment(attachment: StoredDeetAttachment): StoredDeetAttachment {
  const normalizedPreviews = Array.isArray(attachment.previews)
    ? attachment.previews.map((preview) => asImageString(preview)).filter(Boolean)
    : [];
  const fallbackPreview = firstImageString(
    attachment.previewUrl,
    attachment.image,
    attachment.imageUrl,
    attachment.url,
    attachment.src,
  );

  return {
    ...attachment,
    previews: [...normalizedPreviews, ...[fallbackPreview].filter(Boolean)],
  };
}

export function getStoredDeetPreviewImage(item: Partial<StoredDeet> & Record<string, unknown>) {
  const attachments = Array.isArray(item.attachments) ? (item.attachments as StoredDeetAttachment[]) : [];

  const attachmentPreview = attachments
    .map((attachment) => normalizeAttachment(attachment))
    .find((attachment) => attachment.previews?.length)?.previews?.[0];

  const images = Array.isArray(item.images) ? item.images : [];
  const media = Array.isArray(item.media) ? item.media : [];
  const files = Array.isArray(item.files) ? item.files : [];
  const assets = Array.isArray(item.assets) ? item.assets : [];

  return firstImageString(
    item.previewImage,
    item.image,
    item.imageUrl,
    item.previewUrl,
    item.mediaUrl,
    item.url,
    item.src,
    attachmentPreview,
    images[0],
    media[0] && typeof media[0] === "object" ? (media[0] as Record<string, unknown>).previewUrl : media[0],
    media[0] && typeof media[0] === "object" ? (media[0] as Record<string, unknown>).url : "",
    media[0] && typeof media[0] === "object" ? (media[0] as Record<string, unknown>).src : "",
    files[0] && typeof files[0] === "object" ? (files[0] as Record<string, unknown>).url : files[0],
    files[0] && typeof files[0] === "object" ? (files[0] as Record<string, unknown>).src : "",
    assets[0] && typeof assets[0] === "object" ? (assets[0] as Record<string, unknown>).url : assets[0],
    assets[0] && typeof assets[0] === "object" ? (assets[0] as Record<string, unknown>).src : "",
  );
}

function normalizeStoredDeet(item: Partial<StoredDeet> & Record<string, unknown>) {
  const attachments = Array.isArray(item.attachments)
    ? (item.attachments as StoredDeetAttachment[]).map((attachment) => normalizeAttachment(attachment))
    : [];
  const previewImage = getStoredDeetPreviewImage({
    ...item,
    attachments,
  });

  return {
    ...item,
    attachments,
    previewImage: previewImage || undefined,
    image: firstImageString(item.image, previewImage) || undefined,
  } as StoredDeet;
}

function readRawStoredDeets(): StoredDeet[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(DEETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const normalized = sortNewestFirst(parsed.map((item) => normalizeStoredDeet(item as Partial<StoredDeet> & Record<string, unknown>)));
    const shouldBackfill = normalized.some((item, index) => {
      const original = parsed[index] as Partial<StoredDeet> & Record<string, unknown>;
      return item.previewImage !== original.previewImage || item.image !== original.image;
    });

    if (shouldBackfill) {
      writeRawStoredDeets(normalized);
    }

    return normalized;
  } catch {
    return [];
  }
}

function writeRawStoredDeets(items: StoredDeet[]) {
  if (!canUseStorage()) return;

  const nextItems = sortNewestFirst(items);
  window.localStorage.setItem(DEETS_STORAGE_KEY, JSON.stringify(nextItems));
  window.dispatchEvent(new CustomEvent(DEETS_STORAGE_EVENT, { detail: nextItems }));
}

export function getAllStoredDeets() {
  return readRawStoredDeets();
}

export function getHubStoredDeets(hubId: string) {
  return readRawStoredDeets().filter((item) => item.hubId === hubId);
}

export function clearStoredDeets() {
  if (!canUseStorage()) return;

  window.localStorage.removeItem(DEETS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(DEETS_STORAGE_EVENT, { detail: [] }));
}

export function createStoredDeet(input: CreateStoredDeetInput) {
  const normalizedAttachments = input.attachments.map((attachment) => normalizeAttachment(attachment));
  const previewImage = getStoredDeetPreviewImage({
    ...input,
    attachments: normalizedAttachments,
  });

  const nextDeet: StoredDeet = {
    ...input,
    previewImage: previewImage || undefined,
    image: previewImage || undefined,
    attachments: normalizedAttachments,
    id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `deet-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  writeRawStoredDeets([nextDeet, ...readRawStoredDeets()]);
  return nextDeet;
}

export function subscribeToStoredDeets(callback: (items: StoredDeet[]) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const emitCurrent = () => callback(readRawStoredDeets());
  const handleCustomEvent = () => emitCurrent();
  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== DEETS_STORAGE_KEY) return;
    emitCurrent();
  };

  window.addEventListener(DEETS_STORAGE_EVENT, handleCustomEvent as EventListener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(DEETS_STORAGE_EVENT, handleCustomEvent as EventListener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function storedDeetToHubFeedItem(item: StoredDeet): HubFeedItem {
  return {
    id: item.id,
    kind: item.kind === "Notices" ? "notice" : item.kind === "Photos" ? "photo" : "announcement",
    author: item.authorName,
    time: formatDeetTime(item.createdAt),
    title: item.title,
    body: item.body,
    image: item.previewImage || undefined,
    likes: 0,
    comments: 0,
    views: 1,
  };
}

export function formatDeetTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(createdAt).toLocaleDateString();
}
