import { createClient } from "@/lib/supabase/client";
import type { CreateHubInput, HubRecord } from "@/lib/services/hubs/hub-types";
import {
  HUB_COLUMNS_WITHOUT_PHONE,
  HUB_COLUMNS_WITH_PHONE,
  isMissingPhoneNumberColumnError,
} from "@/lib/services/hubs/query-utils";

function normalizeText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createHub(input: CreateHubInput): Promise<HubRecord> {
  const supabase = createClient();
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  const category = input.category;

  if (!name) {
    throw new Error("Hub name is required.");
  }

  if (!slug) {
    throw new Error("Hub slug is required.");
  }

  if (!category) {
    throw new Error("Hub category is required.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your account: ${userError.message}`);
  }

  if (!user) {
    throw new Error("You must be signed in to create a hub.");
  }

  const payload = {
    name,
    slug,
    category,
    tagline: normalizeText(input.tagline),
    description: normalizeText(input.description),
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    country: normalizeText(input.country),
    cover_image_url: normalizeText(input.coverImageUrl),
    dp_image_url: normalizeText(input.dpImageUrl),
    gallery_image_urls: [],
    created_by: user.id,
  };

  const initialResult = await supabase
    .from("hubs")
    .insert(payload)
    .select(HUB_COLUMNS_WITH_PHONE)
    .single();
  let data = initialResult.data as HubRecord | null;
  let error = initialResult.error;

  if (isMissingPhoneNumberColumnError(error)) {
    const fallbackResult = await supabase
      .from("hubs")
      .insert(payload)
      .select(HUB_COLUMNS_WITHOUT_PHONE)
      .single();

    data = fallbackResult.data as HubRecord | null;
    error = fallbackResult.error;
  }

  if (error) {
    const isDuplicateSlug =
      error.code === "23505" && error.message.toLowerCase().includes("slug");

    if (isDuplicateSlug) {
      throw new Error("That hub URL is already taken. Please try again.");
    }

    throw new Error(`Failed to create hub: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create hub: no hub was returned.");
  }

  const createdHub = data;

  const { error: memberError } = await supabase
    .from("hub_members")
    .insert({
      hub_id: createdHub.id,
      user_id: user.id,
      role: "creator",
      status: "active",
    });

  if (memberError) {
    console.error("[create-hub] Failed to insert creator as member:", memberError);
  }

  return createdHub;
}
