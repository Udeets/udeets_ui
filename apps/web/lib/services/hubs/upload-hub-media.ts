import { createClient } from "@/lib/supabase/client";

const HUB_MEDIA_BUCKET = "hub-media";
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
  slug,
  kind,
}: {
  file: File;
  slug: string;
  kind: "dp" | "cover" | "gallery";
}): Promise<string> {
  const supabase = createClient();

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file for your hub media.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("Hub images must be 5 MB or smaller.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to upload hub media.");
  }

  const extension = fileExtensionFor(file);
  const filePath = `${user.id}/${sanitizeFileName(slug)}/${kind}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(HUB_MEDIA_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload ${kind === "dp" ? "display picture" : "cover image"}: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(HUB_MEDIA_BUCKET).getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error("Hub media uploaded, but a public URL could not be generated.");
  }

  return data.publicUrl;
}
