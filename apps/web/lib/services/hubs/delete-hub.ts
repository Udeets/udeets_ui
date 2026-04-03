import { createClient } from "@/lib/supabase/client";

export async function deleteHub(hubId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.from("hubs").delete().eq("id", hubId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
