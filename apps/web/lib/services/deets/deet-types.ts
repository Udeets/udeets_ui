export type DeetKind = "Posts" | "Notices" | "Photos";

export type DeetAttachment = {
  type: string;
  title: string;
  detail?: string;
  previews?: string[];
  storagePaths?: string[];
  previewUrl?: string;
  image?: string;
  imageUrl?: string;
  url?: string;
  src?: string;
};

export type DeetRecord = {
  id: string;
  hub_id: string;
  author_name: string;
  title: string;
  body: string;
  kind: DeetKind;
  preview_image_url: string | null;
  preview_image_urls: string[] | null;
  attachments: DeetAttachment[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateDeetInput = {
  hubId: string;
  authorName: string;
  title: string;
  body: string;
  kind: DeetKind;
  previewImageUrl?: string;
  previewImageUrls?: string[];
  attachments?: DeetAttachment[];
};
