"use client";

import { UDEETS_LOGO_SRC } from "@/lib/branding";
import type { HubCategorySlug, HubRecord } from "@/lib/hubs";

const CUSTOM_HUBS_STORAGE_KEY = "udeets-custom-hubs";

export type CustomHubRecord = HubRecord & {
  discoverable: boolean;
  selectedCategories: string[];
  isCustom: true;
};

export type CreateCustomHubInput = {
  name: string;
  visibility: CustomHubRecord["visibility"];
  discoverable: boolean;
  selectedCategories: string[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "new-hub";
}

function routeCategoryFor(categories: string[]): HubCategorySlug {
  if (categories.includes("Religious Place")) return "religious-places";
  if (categories.includes("HOA")) return "hoa";
  if (categories.includes("Fitness")) return "fitness";
  if (categories.includes("Pet Club")) return "pet-clubs";
  if (
    categories.some((category) =>
      ["Restaurant", "Grocery", "Salon", "Retail", "Professional Services"].includes(category)
    )
  ) {
    return "restaurants";
  }
  return "communities";
}

function descriptionFor(categories: string[]) {
  if (!categories.length) return "A new uDeets hub for local updates, events, and community connection.";
  if (categories.length === 1) return `${categories[0]} updates, events, and community details in one place.`;
  return `${categories.slice(0, 2).join(" and ")} updates, events, and community details in one place.`;
}

function safeRead(): CustomHubRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CUSTOM_HUBS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CustomHubRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(hubs: CustomHubRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_HUBS_STORAGE_KEY, JSON.stringify(hubs));
}

export function getCustomHubs() {
  return safeRead();
}

export function getCustomHub(category: string, slug: string) {
  return safeRead().find((hub) => hub.category === category && hub.slug === slug) ?? null;
}

export function createCustomHub(input: CreateCustomHubInput) {
  const category = routeCategoryFor(input.selectedCategories);
  const baseSlug = slugify(input.name);
  const existing = safeRead();
  let slug = baseSlug;
  let suffix = 2;

  while (existing.some((hub) => hub.slug === slug && hub.category === category)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const hub: CustomHubRecord = {
    id: `custom-${slug}`,
    name: input.name.trim(),
    category,
    slug,
    href: `/hubs/${category}/${slug}`,
    locationLabel: "Local Hub",
    distanceMi: 0,
    membersLabel: "1 member",
    visibility: input.visibility,
    description: descriptionFor(input.selectedCategories),
    tagline: `${input.name.trim()} on uDeets`,
    intro: "Start sharing updates, upcoming events, and key files with your community.",
    website: "",
    dpImage: UDEETS_LOGO_SRC,
    heroImage: "/udeets-home.png",
    galleryImages: [],
    feedImages: [],
    adminImages: [],
    tags: [],
    updates: [],
    events: [],
    discoverable: input.discoverable,
    selectedCategories: input.selectedCategories,
    isCustom: true,
  };

  safeWrite([hub, ...existing.filter((existingHub) => existingHub.id !== hub.id)]);
  return hub;
}
