import { apiFetch } from "@/lib/api/client";
import type {
  CreateDeetInput,
  DeetKind,
  DeetRecord,
} from "@/lib/services/deets/deet-types";

export type ListDeetsApiOptions = {
  hubIds?: string[];
  kinds?: DeetKind[] | string[];
  limit?: number;
  publishedOnly?: boolean;
  draftsOnly?: boolean;
};

export type UpdateDeetApiInput = {
  title?: string;
  body?: string;
  kind?: DeetKind;
  previewImageUrl?: string | null;
  previewImageUrls?: string[];
  attachments?: DeetRecord["attachments"];
  allowComments?: boolean;
  isPublished?: boolean;
};

function toCsv(values?: string[]) {
  if (!values?.length) return undefined;
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(",") : undefined;
}

export async function listDeetsApi(options: ListDeetsApiOptions = {}): Promise<DeetRecord[]> {
  const response = await apiFetch<{ deets: DeetRecord[] }>("/deets", {
    query: {
      hubIds: toCsv(options.hubIds),
      kinds: toCsv(options.kinds?.map(String)),
      limit: options.limit,
      publishedOnly: options.publishedOnly,
      draftsOnly: options.draftsOnly,
    },
  });
  return response.deets ?? [];
}

export async function createDeetApi(input: CreateDeetInput): Promise<DeetRecord> {
  const response = await apiFetch<{ deet: DeetRecord }>("/deets", {
    method: "POST",
    body: input,
  });
  return response.deet;
}

export async function updateDeetApi(deetId: string, input: UpdateDeetApiInput): Promise<DeetRecord> {
  const response = await apiFetch<{ deet: DeetRecord }>(`/deets/${encodeURIComponent(deetId)}`, {
    method: "PATCH",
    body: input,
  });
  return response.deet;
}

export async function deleteDeetApi(deetId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/deets/${encodeURIComponent(deetId)}`, {
    method: "DELETE",
  });
}
