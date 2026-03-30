import type { DeetKind, DeetType } from "@/lib/services/deets/deet-types";
import { mapLegacyDeetKindToDeetType } from "@/lib/mappers/deets/map-legacy-deet-kind";

export interface DashboardAlertSource {
  id?: string | null;
  hubId?: string | null;
  hub_id?: string | null;
  type?: DeetType | string | null;
  kind?: DeetKind | string | null;
  title?: string | null;
  body?: string | null;
  summary?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  important?: boolean | null;
  isImportant?: boolean | null;
  urgent?: boolean | null;
}

export interface DashboardAlertItem {
  id: string;
  hubId: string;
  deetId: string;
  title: string;
  summary?: string | null;
  createdAt?: string | null;
  severity?: "info" | "important";
  sourceType?: string;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function summarizeBody(body?: string | null) {
  const text = asNonEmptyString(body);
  if (!text) return null;
  return text.length > 140 ? `${text.slice(0, 137).trimEnd()}...` : text;
}

function resolveSourceType(deet: DashboardAlertSource): DeetType {
  const directType = asNonEmptyString(deet.type);
  if (directType === "alert" || directType === "announcement") {
    return directType;
  }

  if (directType) {
    return mapLegacyDeetKindToDeetType(directType);
  }

  return mapLegacyDeetKindToDeetType(deet.kind);
}

export function mapDeetToAlert(deet: DashboardAlertSource): DashboardAlertItem | null {
  const sourceType = resolveSourceType(deet);
  const isLegacyNotice = deet.kind === "Notices";
  const isAlertLike = sourceType === "alert" || isLegacyNotice;

  if (!isAlertLike) {
    return null;
  }

  const title = asNonEmptyString(deet.title) ?? summarizeBody(deet.body) ?? "Notice";
  const summary = asNonEmptyString(deet.summary) ?? summarizeBody(deet.body);
  const severity = deet.important || deet.isImportant || deet.urgent ? "important" : "info";
  const deetId = asNonEmptyString(deet.id) ?? "";

  return {
    id: deetId,
    hubId: asNonEmptyString(deet.hubId) ?? asNonEmptyString(deet.hub_id) ?? "",
    deetId,
    title,
    summary,
    createdAt: asNonEmptyString(deet.createdAt) ?? asNonEmptyString(deet.created_at),
    severity,
    sourceType,
  };
}
