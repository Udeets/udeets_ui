"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { chatApiDeleteRoom, chatApiPatchRoom } from "@/lib/chat/chat-browser-api";
import type { ChatRoomDetail } from "@/lib/services/chat/get-chat-room";
import { isAllowedChatRetentionDays, type ChatRetentionDays } from "@/lib/services/chat/chat-retention";
import { ComposerMenuSelect, type ComposerMenuSelectOption } from "../deets/composer/ComposerMenuSelect";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT_CLASS, cn } from "../hubUtils";

const RETENTION_SELECT_OPTIONS: ComposerMenuSelectOption[] = [
  { value: "", label: "Keep Messages Indefinitely" },
  { value: "30", label: "Delete After 30 Days" },
  { value: "90", label: "Delete After 90 Days" },
  { value: "365", label: "Delete After 1 Year" },
];

const INVITE_POLICY_OPTIONS: ComposerMenuSelectOption[] = [
  { value: "hub_admins_only", label: "Hub Admins Only" },
  { value: "room_admins", label: "Room Admins" },
];

const POLL_CREATOR_OPTIONS: ComposerMenuSelectOption[] = [
  { value: "room_admin_and_moderator", label: "Admins and Moderators" },
  { value: "room_admin_only", label: "Room Admins Only" },
  { value: "all_active_members", label: "All Active Members" },
];

export function ChatRoomSettingsModal({
  open,
  roomId,
  room,
  onClose,
  onSaved,
  onDeleted,
  onError,
}: {
  open: boolean;
  roomId: string;
  room: ChatRoomDetail | null;
  onClose: () => void;
  onSaved: (room: ChatRoomDetail) => void | Promise<void>;
  /** When the room row is removed (DELETE); caller should clear selection and reload room list. */
  onDeleted?: () => void | Promise<void>;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [archived, setArchived] = useState(false);
  const [attachmentsEnabled, setAttachmentsEnabled] = useState(true);
  const [invitePolicy, setInvitePolicy] = useState<"hub_admins_only" | "room_admins">("hub_admins_only");
  const [whoCanCreatePolls, setWhoCanCreatePolls] = useState<
    "room_admin_and_moderator" | "room_admin_only" | "all_active_members"
  >("room_admin_and_moderator");
  const [retentionDays, setRetentionDays] = useState<ChatRetentionDays>(null);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => {
    if (!open || !room) return;
    setName(room.name);
    setDescription(room.description ?? "");
    setArchived(Boolean(room.archivedAt));
    setRetentionDays(isAllowedChatRetentionDays(room.retentionDays) ? room.retentionDays : null);
    setAttachmentsEnabled(room.settings.attachmentsEnabled);
    setInvitePolicy(room.settings.invitePolicy);
    setWhoCanCreatePolls(room.settings.whoCanCreatePolls);
  }, [open, room]);

  if (!open) return null;

  const submit = async () => {
    const n = name.trim();
    if (!n) {
      onError("Room name is required.");
      return;
    }
    setBusy(true);
    try {
      const { room: next } = await chatApiPatchRoom(roomId, {
        name: n,
        description: description.trim() || null,
        archived,
        retentionDays,
        settings: {
          attachmentsEnabled,
          invitePolicy,
          whoCanCreatePolls,
        },
      });
      onSaved(next);
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not update room.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    const ok = window.confirm(
      "Delete this chat room permanently? All messages, polls, and attachments in this room will be removed. This cannot be undone.",
    );
    if (!ok) return;
    setDeleteBusy(true);
    try {
      await chatApiDeleteRoom(roomId);
      await onDeleted?.();
      onClose();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not delete room.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="chat-room-settings-title">
      <div className={cn(CARD, "max-h-[90vh] w-full max-w-md overflow-y-auto p-5 shadow-xl")}>
        <h2 id="chat-room-settings-title" className="text-lg font-semibold text-[var(--ud-text-primary)]">
          Room Settings
        </h2>
        <p className="mt-2 text-xs text-[var(--ud-text-secondary)]">
          To change how chat notifications look, go to{" "}
          <Link href="/settings" className="font-medium text-[var(--ud-brand-primary)] underline">
            Settings, then Notifications
          </Link>
          .
        </p>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Name</label>
        <input className={cn(INPUT_CLASS, "mt-1")} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Description</label>
        <textarea className={cn(INPUT_CLASS, "mt-1 min-h-[80px]")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-[var(--ud-text-primary)]">
          <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="mt-0.5 rounded border-[var(--ud-border)]" />
          <span>
            <span className="font-medium">Archive Room</span>
            <span className="mt-0.5 block text-xs font-normal text-[var(--ud-text-secondary)]">
              Members will not see this room in their list anymore. Hub admins can still find it under Archived and bring it
              back or change settings.
            </span>
          </span>
        </label>
        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">
          Message Retention
        </label>
        <p className="mt-1 text-xs text-[var(--ud-text-secondary)]">
          After the time you pick, older messages are removed automatically. The default is to keep all messages.
        </p>
        <ComposerMenuSelect
          className="mt-1 w-full"
          disabled={!room}
          value={retentionDays === null ? "" : String(retentionDays)}
          onChange={(v) => setRetentionDays(v === "" ? null : (Number(v) as 30 | 90 | 365))}
          options={RETENTION_SELECT_OPTIONS}
          menuMinWidthPx={280}
        />
        <hr className="my-4 border-[var(--ud-border-subtle)]" />
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Room Options</p>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-[var(--ud-text-primary)]">
          <input
            type="checkbox"
            checked={attachmentsEnabled}
            onChange={(e) => setAttachmentsEnabled(e.target.checked)}
            className="rounded border-[var(--ud-border)]"
          />
          Attachments Enabled
        </label>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Who Can Invite</label>
        <ComposerMenuSelect
          className="mt-1 w-full"
          disabled={!room}
          value={invitePolicy}
          onChange={(v) => setInvitePolicy(v as "hub_admins_only" | "room_admins")}
          options={INVITE_POLICY_OPTIONS}
          menuMinWidthPx={260}
        />
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--ud-text-muted)]">Who Can Create Polls</label>
        <ComposerMenuSelect
          className="mt-1 w-full"
          disabled={!room}
          value={whoCanCreatePolls}
          onChange={(v) =>
            setWhoCanCreatePolls(v as "room_admin_and_moderator" | "room_admin_only" | "all_active_members")
          }
          options={POLL_CREATOR_OPTIONS}
          menuMinWidthPx={280}
        />
        <div className="mt-6 rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-subtle)] p-3">
          <p className="text-sm font-medium text-[var(--ud-danger)]">Delete room</p>
          <p className="mt-1 text-xs text-[var(--ud-text-secondary)]">
            Permanently removes this room and all of its chat history for everyone. Hub staff or room admins only.
          </p>
          <button
            type="button"
            className="mt-2 w-full rounded-lg border border-[var(--ud-border)] bg-[var(--ud-bg-card)] px-3 py-2 text-sm font-medium text-[var(--ud-danger)] hover:bg-[var(--ud-bg-subtle)] disabled:opacity-50"
            disabled={deleteBusy || !room}
            onClick={() => void confirmDelete()}
          >
            {deleteBusy ? "Deleting…" : "Delete room permanently"}
          </button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={BUTTON_SECONDARY} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={BUTTON_PRIMARY} disabled={busy || !room} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
