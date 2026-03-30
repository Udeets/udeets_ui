import type { DeetKind, DeetType, EventDeetPayload } from "@/lib/services/deets/deet-types";
import { mapLegacyDeetKindToDeetType } from "@/lib/mappers/deets/map-legacy-deet-kind";

export interface DashboardEventSource {
  id?: string | null;
  hubId?: string | null;
  hub_id?: string | null;
  type?: DeetType | string | null;
  kind?: DeetKind | string | null;
  title?: string | null;
  body?: string | null;
  payload?: EventDeetPayload | Record<string, unknown> | null;
  event?: EventDeetPayload | Record<string, unknown> | null;
  startsAt?: string | null;
  starts_at?: string | null;
  endsAt?: string | null;
  ends_at?: string | null;
  location?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
}

export interface DashboardEventItem {
  id: string;
  hubId: string;
  deetId: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  createdAt?: string | null;
  sourceType?: string;
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function resolveSourceType(deet: DashboardEventSource): DeetType {
  const directType = asNonEmptyString(deet.type);
  if (directType === "event") return "event";
  if (directType) return mapLegacyDeetKindToDeetType(directType);
  return mapLegacyDeetKindToDeetType(deet.kind);
}

function readPayloadString(payload: DashboardEventSource["payload"], key: "startsAt" | "endsAt" | "location") {
  if (!payload || typeof payload !== "object") return null;
  return asNonEmptyString(payload[key]);
}

export function mapDeetToEvent(deet: DashboardEventSource): DashboardEventItem | null {
  const sourceType = resolveSourceType(deet);
  const payload = (deet.payload ?? deet.event) as DashboardEventSource["payload"];
  const startsAt =
    asNonEmptyString(deet.startsAt) ??
    asNonEmptyString(deet.starts_at) ??
    readPayloadString(payload, "startsAt");
  const endsAt =
    asNonEmptyString(deet.endsAt) ??
    asNonEmptyString(deet.ends_at) ??
    readPayloadString(payload, "endsAt");
  const location = asNonEmptyString(deet.location) ?? readPayloadString(payload, "location");

  if (sourceType !== "event" && !startsAt && !endsAt) {
    return null;
  }

  const deetId = asNonEmptyString(deet.id) ?? "";

  return {
    id: deetId,
    hubId: asNonEmptyString(deet.hubId) ?? asNonEmptyString(deet.hub_id) ?? "",
    deetId,
    title: asNonEmptyString(deet.title) ?? "Event",
    startsAt,
    endsAt,
    location,
    createdAt: asNonEmptyString(deet.createdAt) ?? asNonEmptyString(deet.created_at),
    sourceType,
  };
}
