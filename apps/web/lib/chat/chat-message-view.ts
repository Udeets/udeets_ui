import type { ChatMessageListItem } from "@/lib/services/chat/list-chat-messages";

/** UI row: server message plus optional client send lifecycle. */
export type ChatMessageViewModel = ChatMessageListItem & {
  clientSendState?: "pending" | "failed";
  clientSendError?: string;
  /** Stable key while `id` may be temp then replaced with server id. */
  clientLocalId?: string;
};
