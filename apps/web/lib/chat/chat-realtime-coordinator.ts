"use client";

import type { z } from "zod";

import type { ChatRoomRealtimeHandlers } from "@/lib/chat/subscribe-chat-room-realtime";
import { subscribeChatRoomRealtime } from "@/lib/chat/subscribe-chat-room-realtime";
import {
  editMessageBodySchema,
  pollVoteBodySchema,
  reactionBodySchema,
  sendMessageBodySchema,
} from "@/lib/services/chat/chat-schemas";

type SendMessageBody = z.infer<typeof sendMessageBodySchema>;
type EditMessageBody = z.infer<typeof editMessageBodySchema>;
type ReactionBody = z.infer<typeof reactionBodySchema>;
type PollVoteBody = z.infer<typeof pollVoteBodySchema>;

async function readJsonError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    if (typeof j.error === "string" && j.error.length) return j.error;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

/**
 * Client façade mapping C2S intents to REST + Realtime:
 * - **room.join** → preflight + `subscribeChatRoomRealtime`
 * - **room.leave** → unsubscribe
 * - **message.send** / **message.edit** / **message.delete**, **reaction.add** / **reaction.remove**, **poll.vote**, **typing.*** → same `/api/chat/*` routes as the REST surface (services stay authoritative).
 */
export class ChatRealtimeCoordinator {
  private unsub: (() => Promise<void>) | null = null;

  constructor(
    private readonly roomId: string,
    private readonly opts?: { apiBase?: string },
  ) {}

  private base(): string {
    return this.opts?.apiBase ?? "";
  }

  /** `room.join` — opens Realtime; repeats preflight + RLS on every reconnect. */
  async join(handlers: ChatRoomRealtimeHandlers): Promise<void> {
    await this.leave();
    this.unsub = await subscribeChatRoomRealtime(this.roomId, handlers, { apiBase: this.base() });
  }

  /** `room.leave` */
  async leave(): Promise<void> {
    if (this.unsub) {
      await this.unsub();
      this.unsub = null;
    }
  }

  /** `message.send` — persists via REST → same `sendChatMessage` service as POST /messages. */
  async sendMessage(body: SendMessageBody): Promise<{ messageId: string }> {
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/messages`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readJsonError(res));
    return (await res.json()) as { messageId: string };
  }

  /** `message.edit` */
  async editMessage(messageId: string, body: EditMessageBody): Promise<void> {
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/messages/${messageId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readJsonError(res));
  }

  /** `message.delete` — optional `moderationReason` forwarded to the REST handler (moderation flows). */
  async deleteMessage(messageId: string, opts?: { moderationReason?: string }): Promise<void> {
    const init: RequestInit = {
      method: "DELETE",
      credentials: "include",
    };
    if (opts?.moderationReason != null && opts.moderationReason !== "") {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify({ moderationReason: opts.moderationReason });
    }
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/messages/${messageId}`, init);
    if (!res.ok) throw new Error(await readJsonError(res));
  }

  /** `reaction.add` */
  async addReaction(messageId: string, body: ReactionBody): Promise<void> {
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/messages/${messageId}/reactions`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readJsonError(res));
  }

  /** `reaction.remove` — same query contract as `DELETE .../reactions?emoji=`. */
  async removeReaction(messageId: string, emoji: string): Promise<void> {
    const q = new URLSearchParams({ emoji });
    const res = await fetch(
      `${this.base()}/api/chat/rooms/${this.roomId}/messages/${messageId}/reactions?${q.toString()}`,
      { method: "DELETE", credentials: "include" },
    );
    if (!res.ok) throw new Error(await readJsonError(res));
  }

  /** `poll.vote` */
  async votePoll(pollId: string, body: PollVoteBody): Promise<void> {
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/polls/${pollId}/vote`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readJsonError(res));
  }

  /** `typing.started` */
  async typingStarted(): Promise<void> {
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/typing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "started" }),
    });
    if (!res.ok) throw new Error(await readJsonError(res));
  }

  /** `typing.stopped` */
  async typingStopped(): Promise<void> {
    const res = await fetch(`${this.base()}/api/chat/rooms/${this.roomId}/typing`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase: "stopped" }),
    });
    if (!res.ok) throw new Error(await readJsonError(res));
  }
}
