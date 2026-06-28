import { prepareHubMediaUploadApi } from "@/lib/api/hubs";
import { uploadToSignedUrl } from "@/lib/api/deet-media";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fileExtensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function uploadHubMedia({
  file,
  hubId,
  slug,
  kind,
}: {
  file: File;
  hubId: string;
  slug: string;
  kind: "dp" | "cover" | "gallery";
}): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file for your hub media.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Hub images must be 5 MB or smaller.");
  }

  const extension = fileExtensionFor(file);
  const safeName = `${sanitizeFileName(slug) || "hub"}-${Date.now()}.${extension}`;
  const prepared = await prepareHubMediaUploadApi({
    hubId,
    kind,
    fileName: safeName,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  await uploadToSignedUrl(prepared.signedUploadUrl, file, file.type);
  if (!prepared.publicUrl) {
    throw new Error("Hub media uploaded, but a public URL could not be generated.");
  }
  return prepared.publicUrl;
}
