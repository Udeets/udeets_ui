const HUB_COLUMNS_BASE = `
  id,
  name,
  slug,
  category,
  tagline,
  description,
  city,
  state,
  country,
  cover_image_url,
  cover_image_offset_y,
  dp_image_url,
  gallery_image_urls,
  website_url,
  facebook_url,
  instagram_url,
  youtube_url,
  visibility,
  accent_color,
  created_by,
  created_at,
  updated_at
`;

export const HUB_COLUMNS_WITH_PHONE = `
  ${HUB_COLUMNS_BASE},
  phone_number
`;

export const HUB_COLUMNS_WITHOUT_PHONE = HUB_COLUMNS_BASE;

export function isMissingPhoneNumberColumnError(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("phone_number") && message.includes("column");
}
