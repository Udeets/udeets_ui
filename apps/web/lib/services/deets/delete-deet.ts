import { deleteDeetApi } from "@/lib/api/deets";

/**
 * Deletes a deet by ID. The caller must be the deet's author or a hub admin.
 * The API enforces ownership / admin authorization.
 */
export async function deleteDeet(deetId: string): Promise<void> {
  await deleteDeetApi(deetId);
}
