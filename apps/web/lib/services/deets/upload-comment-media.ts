import {
  prepareDeetMediaUploadApi,
  uploadToSignedUrl,
} from "@/lib/api/deet-media";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface CommentMediaUpload {
  url: string;
  name: string;
  type: "image" | "file";
}

/** Upload an image for a comment. */
export async function uploadCommentImage(file: File): Promise<CommentMediaUpload> {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Image must be 5 MB or smaller.");
  const prepared = await prepareDeetMediaUploadApi({
    context: "comment",
    kind: "image",
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  await uploadToSignedUrl(prepared.signedUploadUrl, file, file.type);
  return { url: prepared.publicUrl, name: file.name, type: "image" };
}

/** Upload a file attachment for a comment. */
export async function uploadCommentFile(file: File): Promise<CommentMediaUpload> {
  if (file.size > MAX_FILE_SIZE) throw new Error("File must be 10 MB or smaller.");
  const prepared = await prepareDeetMediaUploadApi({
    context: "comment",
    kind: "file",
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  await uploadToSignedUrl(prepared.signedUploadUrl, file, file.type);
  return { url: prepared.publicUrl, name: file.name, type: "file" };
}
