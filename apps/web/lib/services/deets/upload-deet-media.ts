import { createClient } from "@/lib/supabase/client";

const DEET_MEDIA_BUCKET = "deet-media";
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
  const supabase = createClient();

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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to upload files.");
  }

  const extension = fileExtensionFor(file);
  const folder = kind === "image" ? "deets" : "files";
  const hubFolder = sanitizeFileName(hubSlug || hubId);
  const filePath =
    kind === "image"
      ? `${user.id}/${hubFolder}/${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`
      : (() => {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
          const safeStem = sanitizeFileName(nameWithoutExt).slice(0, 48) || "file";
          const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
          return `${user.id}/${hubFolder}/${folder}/${unique}-${safeStem}.${extension}`;
        })();

  const { error: uploadError } = await supabase.storage
    .from(DEET_MEDIA_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(DEET_MEDIA_BUCKET).getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error("Upload succeeded, but a public URL could not be generated.");
  }

  return {
    path: filePath,
    publicUrl: data.publicUrl,
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    sizeBytes: file.size,
    kind,
  };
}
