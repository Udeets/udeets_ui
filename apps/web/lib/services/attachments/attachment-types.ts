export const ATTACHMENT_OWNER_TYPES = ["hub", "deet"] as const;
export type AttachmentOwnerType = (typeof ATTACHMENT_OWNER_TYPES)[number];

export const ATTACHMENT_KINDS = ["image", "video", "file", "url"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_SECTIONS = ["media", "files"] as const;
export type AttachmentSection = (typeof ATTACHMENT_SECTIONS)[number];

export interface Attachment {
  id: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  kind: AttachmentKind;
  name?: string | null;
  mimeType?: string | null;
  url: string;
  previewUrl?: string | null;
  createdAt?: string | null;
}
