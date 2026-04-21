import type { DeetKind, DeetType } from "@/lib/services/deets/deet-types";

export const LEGACY_DEET_KIND_TO_TYPE: Record<DeetKind, DeetType> = {
  Posts: "update",
  Notices: "announcement",
  Photos: "media",
  News: "update",
  Deals: "update",
  Hazards: "alert",
  Alerts: "alert",
  Jobs: "update",
};

export const DEET_TYPE_TO_LEGACY_BUCKET: Partial<Record<DeetType, DeetKind>> = {
  update: "Posts",
  announcement: "Notices",
  alert: "Notices",
  media: "Photos",
};

// These mappings intentionally stay conservative so current screens can keep
// using legacy buckets while normalized deet types expand over time.
export function mapLegacyDeetKindToDeetType(kind: DeetKind | string | null | undefined): DeetType {
  if (!kind) return "update";
  // Transitional bucket name if a DB had applied the short-lived "Deets" rename.
  if (kind === "Deets") return "update";
  return LEGACY_DEET_KIND_TO_TYPE[kind as DeetKind] ?? "update";
}

export function mapDeetTypeToLegacyBucket(type: DeetType | string | null | undefined): DeetKind {
  if (!type) return "Posts";
  return DEET_TYPE_TO_LEGACY_BUCKET[type as DeetType] ?? "Posts";
}
