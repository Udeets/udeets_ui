import type { Step, Visibility } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getInitialStep(value: string | null): Step {
  const initialStep = Number(value) as Step;
  return initialStep === 2 || initialStep === 3 ? initialStep : 1;
}

export function getInitialVisibility(value: string | null): Visibility {
  return value === "Public" ? "Public" : "Private";
}

export function getInitialCategories(value: string | null): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "new-hub"
  );
}

export function categoryFor(categories: string[]) {
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

export function descriptionFor(categories: string[]) {
  if (!categories.length) return "A new uDeets hub for local updates, events, and community connection.";
  if (categories.length === 1) return `${categories[0]} updates, events, and community details in one place.`;
  return `${categories.slice(0, 2).join(" and ")} updates, events, and community details in one place.`;
}
