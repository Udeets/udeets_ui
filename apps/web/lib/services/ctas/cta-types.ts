export const CTA_ACTION_TYPES = [
  "url",
  "whatsapp",
  "phone",
  "maps",
  "email",
  "doordash",
  "ubereats",
  "opentable",
  "instagram",
  "pdf",
] as const;

export type CTAActionType = (typeof CTA_ACTION_TYPES)[number];

export interface HubCTARecord {
  id: string;
  hub_id: string;
  label: string;
  action_type: CTAActionType;
  action_value: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpsertCTAInput {
  id?: string;
  hub_id: string;
  label: string;
  action_type: CTAActionType;
  action_value: string;
  position: number;
  is_visible: boolean;
}

export const MAX_CTAS_PER_HUB = 4;
