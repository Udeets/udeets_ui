import type { HubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";

export type HubTab = "About" | "Posts" | "Attachments" | "Members" | "Menu" | "Events" | "Reviews" | "Schedule" | "Notices" | "Requests" | "Documents" | "Polls" | "Settings";
export type HubPanel = "posts" | "challenges" | "settings" | "members" | "invite";

export type ViewerState = {
  open: boolean;
  images: string[];
  index: number;
  title: string;
  body: string;
  focusId?: string;
};

export type PendingNavigation = {
  tab: HubTab;
  panel: HubPanel;
  membersMode?: "list" | "invite";
  membersView?: "members" | "admins";
  attachmentsView?: "photos" | "files";
};

export type ConnectLinks = {
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  phone: string;
};

export type HubMemberRoleItem = {
  name: string;
  role: string;
};

export type HubSectionSharedProps = {
  cardClassName: string;
  buttonPrimaryClassName: string;
  buttonSecondaryClassName: string;
  premiumIconWrapperClassName: string;
  hub: HubRecord;
  hubContent: HubContent;
};
