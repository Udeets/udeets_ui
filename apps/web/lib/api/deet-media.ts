import { apiFetch } from "@/lib/api/client";

export type PreparedDeetMediaUpload = {
  bucket: string;
  path: string;
  storageKey?: string;
  signedUploadUrl: string;
  publicUrl: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  kind: "image" | "file";
  token?: string | null;
};

type PrepareDeetMediaPayload = {
  context: "deet" | "comment";
  kind: "image" | "file";
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  hubId?: string;
  hubSlug?: string;
};

export async function prepareDeetMediaUploadApi(
  payload: PrepareDeetMediaPayload,
): Promise<PreparedDeetMediaUpload> {
  return apiFetch("/deets/media/prepare", {
    method: "POST",
    body: payload,
  });
}

export async function uploadToSignedUrl(url: string, file: Blob, mimeType: string): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": mimeType || "application/octet-stream" },
    body: file,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Upload failed (${response.status})`);
  }
}
