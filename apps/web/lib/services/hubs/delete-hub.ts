import { deleteHubApi } from "@/lib/api/hubs";

export async function deleteHub(hubId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ok = await deleteHubApi(hubId);
    return ok ? { success: true } : { success: false, error: "Could not delete hub." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not delete hub.",
    };
  }
}
