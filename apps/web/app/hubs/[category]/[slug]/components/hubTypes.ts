import type { HubContent } from "@/lib/hub-content";
import type { HubRecord } from "@/lib/hubs";

export type HubTab = "About" | "Posts" | "Events" | "Members" | "Photos" | "Files" | "Admins" | "Settings";
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
