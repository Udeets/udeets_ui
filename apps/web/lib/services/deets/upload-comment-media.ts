import { createClient } from "@/lib/supabase/client";

const DEET_MEDIA_BUCKET = "deet-media";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function extensionFor(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext) return ext;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "application/pdf") return "pdf";
  return "bin";
}

export interface CommentMediaUpload {
  url: string;
  name: string;
  type: "image" | "file";
}

/** Upload an image for a comment. */
export async function uploadCommentImage(file: File): Promise<CommentMediaUpload> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Image must be 5 MB or smaller.");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const ext = extensionFor(file);
  const path = `${user.id}/comments/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(DEET_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(DEET_MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, type: "image" };
}

/** Upload a file attachment for a comment. */
export async function uploadCommentFile(file: File): Promise<CommentMediaUpload> {
  if (file.size > MAX_FILE_SIZE) throw new Error("File must be 10 MB or smaller.");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");

  const ext = extensionFor(file);
  const safeName = sanitize(file.name.replace(/\.[^.]+$/, ""));
  const path = `${user.id}/comments/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage.from(DEET_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(DEET_MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, type: "file" };
}
