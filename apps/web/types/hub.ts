import type { CreateHubInput as ServiceCreateHubInput, HubCategory, HubRecord as ServiceHubRecord } from "@/lib/services/hubs/hub-types";

export type Hub = ServiceHubRecord;

export type CreateHubInput = ServiceCreateHubInput;

export type HubCategorySlug = HubCategory;
