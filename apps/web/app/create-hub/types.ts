export type Step = 1 | 2 | 3;

export type Visibility = "Private" | "Public";

export type CategoryGroup = {
  title: string;
  items: string[];
};

export type VisibilityOption = {
  title: string;
  value: Visibility;
  description: string;
};
