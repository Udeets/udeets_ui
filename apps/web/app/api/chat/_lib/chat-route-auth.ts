import { createClient } from "@/lib/supabase/server";
import { ChatUnauthorizedError } from "@/lib/services/chat/chat-errors";

export async function requireChatUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user?.id) {
    throw new ChatUnauthorizedError();
  }
  return user.id;
}
