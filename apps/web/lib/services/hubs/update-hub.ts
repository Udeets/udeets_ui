import { createClient } from "@/lib/supabase/client";
import type { HubRecord, UpdateHubInput } from "@/lib/services/hubs/hub-types";
import {
  HUB_COLUMNS_WITHOUT_PHONE,
  HUB_COLUMNS_WITH_PHONE,
  isMissingPhoneNumberColumnError,
} from "@/lib/services/hubs/query-utils";

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeUrl(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function updateHub(hubId: string, input: UpdateHubInput): Promise<HubRecord> {
  const supabase = createClient();

  if (!hubId.trim()) {
    throw new Error("Hub id is required.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to update this hub.");
  }

  const payload: Record<string, string | string[] | number | null> = {};

  if (input.name !== undefined) {
    payload.name = normalizeText(input.name);
  }

  if (input.description !== undefined) {
    payload.description = normalizeText(input.description);
  }

  if (input.category !== undefined) {
    payload.category = input.category;
  }

  if (input.websiteUrl !== undefined) {
    payload.website_url = normalizeUrl(input.websiteUrl);
  }

  if (input.facebookUrl !== undefined) {
    payload.facebook_url = normalizeUrl(input.facebookUrl);
  }

  if (input.instagramUrl !== undefined) {
    payload.instagram_url = normalizeUrl(input.instagramUrl);
  }

  if (input.youtubeUrl !== undefined) {
    payload.youtube_url = normalizeUrl(input.youtubeUrl);
  }

  if (input.phoneNumber !== undefined) {
    payload.phone_number = normalizeText(input.phoneNumber);
  }

  if (input.coverImageUrl !== undefined) {
    payload.cover_image_url = normalizeText(input.coverImageUrl);
  }

  if (input.coverImageOffsetY !== undefined) {
    // Clamp 0–100 so the DB check-constraint can't reject it.
    const clamped = Math.min(100, Math.max(0, input.coverImageOffsetY));
    payload.cover_image_offset_y = clamped;
  }

  if (input.dpImageUrl !== undefined) {
    payload.dp_image_url = normalizeText(input.dpImageUrl);
  }

  if (input.dpImageOffsetY !== undefined) {
    // Clamp 0–100 so the DB check-constraint can't reject it.
    const clamped = Math.min(100, Math.max(0, input.dpImageOffsetY));
    payload.dp_image_offset_y = clamped;
  }

  if (input.galleryImageUrls !== undefined) {
    payload.gallery_image_urls = input.galleryImageUrls;
  }

  if (input.accentColor !== undefined) {
    payload.accent_color = normalizeText(input.accentColor);
  }

  if (input.visibility !== undefined) {
    payload.visibility = input.visibility;
  }

  if (input.city !== undefined) {
    payload.city = normalizeText(input.city);
  }

  if (input.state !== undefined) {
    payload.state = normalizeText(input.state);
  }

  if (input.country !== undefined) {
    payload.country = normalizeText(input.country);
  }

  const initialResult = await supabase
    .from("hubs")
    .update(payload)
    .eq("id", hubId.trim())
    .eq("created_by", user.id)
    .select(HUB_COLUMNS_WITH_PHONE)
    .single();
  let data = initialResult.data as HubRecord | null;
  let error = initialResult.error;

  if (isMissingPhoneNumberColumnError(error)) {
    if (input.phoneNumber !== undefined) {
      throw new Error("The hubs.phone_number column is missing. Run the required Supabase SQL migration first.");
    }

    const fallbackResult = await supabase
      .from("hubs")
      .update(payload)
      .eq("id", hubId.trim())
      .eq("created_by", user.id)
      .select(HUB_COLUMNS_WITHOUT_PHONE)
      .single();

    data = fallbackResult.data as HubRecord | null;
    error = fallbackResult.error;
  }

  if (error) {
    throw new Error(`Failed to update hub: ${error.message}`);
  }

  if (!data) {
    throw new Error("You do not have permission to update this hub.");
  }

  return data;
}
