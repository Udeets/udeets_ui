export type HubTemplate =
  | "general"
  | "food_dining"
  | "home_services"
  | "health_wellness"
  | "hoa"
  | "faith"
  | "pta"
  | "sports"
  | "events"
  | "retail";

export type HubLayout = "business" | "community";

export type HubTab = "About" | "Posts" | "Attachments" | "Members" | "Menu" | "Events" | "Reviews" | "Schedule" | "Notices" | "Requests" | "Documents" | "Polls" | "Settings";

export interface HubTerminology {
  hub: string;
  deets: string;
  members: string;
  admin: string;
  about: string;
}

export interface HubCTA {
  label: string;
  actionType: "url" | "whatsapp" | "phone" | "maps" | "email" | "doordash" | "ubereats" | "opentable" | "instagram" | "pdf";
  actionValue: string;
}

export interface HubMemberRole {
  role: string;
  who: string;
  permissions: string;
}

export interface HubDiscoverCard {
  showCover: boolean;
  badges: string[];
  showRating?: boolean;
  showButton: boolean;
  buttonLabel: string;
}

export interface HubTemplateConfig {
  template: HubTemplate;
  layout: HubLayout;
  variants: string[];
  terminology: HubTerminology;
  tabs: HubTab[];
  postTypes: Array<{ type: string; icon: string; description: string }>;
  aboutSections: string[];
  defaultCTAs: HubCTA[];
  keyFields: string[];
  memberRoles: HubMemberRole[];
  discoverCard: HubDiscoverCard;
}
