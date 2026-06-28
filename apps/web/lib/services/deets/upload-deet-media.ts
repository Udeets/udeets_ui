import {
  prepareDeetMediaUploadApi,
  uploadToSignedUrl,
} from "@/lib/api/deet-media";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const ALLOWED_FILE_MIME_TYPES = new Set<string>([
  // images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // text
  "text/plain",
  "text/csv",
  // archives
  "application/zip",
]);

export type UploadedDeetMedia = {
  path: string;
  publicUrl: string;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  kind: "image" | "file";
};

export async function uploadDeetMedia({
  file,
  hubId,
  hubSlug,
  kind = "image",
}: {
  file: File;
  hubId: string;
  hubSlug: string;
  kind?: "image" | "file";
}): Promise<UploadedDeetMedia> {
  const isImageByMime = file.type.startsWith("image/");

  if (kind === "image" && !isImageByMime) {
    throw new Error("Please upload an image file for your deet.");
  }

  if (kind === "file") {
    if (!ALLOWED_FILE_MIME_TYPES.has(file.type)) {
      throw new Error("This file type isn't supported. Allowed: PDF, Word, Excel, PowerPoint, text, CSV, zip, and common images.");
    }
  }

  const maxSize = kind === "image" ? MAX_IMAGE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  if (file.size > maxSize) {
    const mb = Math.round(maxSize / 1024 / 1024);
    throw new Error(`File must be ${mb} MB or smaller.`);
  }

  const prepared = await prepareDeetMediaUploadApi({
    context: "deet",
    kind,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    hubId,
    hubSlug,
  });
  await uploadToSignedUrl(prepared.signedUploadUrl, file, file.type);

  return {
    path: prepared.path,
    publicUrl: prepared.publicUrl,
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    sizeBytes: file.size,
    kind,
  };
}
