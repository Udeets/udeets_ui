import type { CategoryGroup, VisibilityOption } from "./types";

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: "Community",
    items: ["Community Group", "Cultural Association", "Religious Place", "HOA", "Parent Group", "Nonprofit"],
  },
  {
    title: "Local Business",
    items: ["Restaurant", "Grocery", "Fitness", "Salon", "Retail", "Professional Services"],
  },
  {
    title: "Interest & Clubs",
    items: ["Sports Club", "Pet Club", "Book Club", "Volunteer Group", "Arts & Music", "Networking"],
  },
];

export const VISIBILITY_OPTIONS: VisibilityOption[] = [
  {
    title: "Private Hub",
    value: "Private",
    description: "Only approved members can view posts, updates, and files.",
  },
  {
    title: "Public Hub",
    value: "Public",
    description: "Anyone can discover and view this hub's public updates.",
  },
];
