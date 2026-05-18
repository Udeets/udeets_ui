-- Generated table DDL bundle

create table if not exists public."attachments" (
  "id" uuid default gen_random_uuid() not null,
  "hub_id" uuid not null,
  "file_url" text not null,
  "file_type" text default 'image'::text not null,
  "source" text,
  "uploaded_by" uuid,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_message_attachments" (
  "id" uuid default gen_random_uuid() not null,
  "message_id" uuid not null,
  "storage_key" text not null,
  "mime_type" text not null,
  "original_filename" text,
  "file_size_bytes" bigint not null,
  "scan_status" text default 'pending'::text not null,
  "uploaded_by" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "deleted_at" timestamp with time zone,
  "thumbnail_key" text,
  "video_preview_key" text,
  "exif_stripped_at" timestamp with time zone
);

create table if not exists public."chat_message_reactions" (
  "id" uuid default gen_random_uuid() not null,
  "message_id" uuid not null,
  "user_id" uuid not null,
  "emoji" text not null,
  "created_at" timestamp with time zone default now() not null,
  "room_id" uuid not null
);

create table if not exists public."chat_message_reports" (
  "id" uuid default gen_random_uuid() not null,
  "hub_id" uuid not null,
  "room_id" uuid not null,
  "reporter_id" uuid not null,
  "target_message_id" uuid,
  "target_user_id" uuid,
  "reason_code" text,
  "details" text,
  "status" text default 'pending'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "resolved_at" timestamp with time zone,
  "resolver_id" uuid,
  "reason" text,
  "appeal_status" text default 'none'::text not null,
  "appeal_body" text,
  "appeal_submitted_at" timestamp with time zone,
  "review_notes_internal" text
);

create table if not exists public."chat_messages" (
  "id" uuid default gen_random_uuid() not null,
  "room_id" uuid not null,
  "sender_id" uuid,
  "message_kind" text not null,
  "body" text,
  "reply_to_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "edited_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "deleted_by" uuid,
  "moderation_reason" text,
  "sender_display_name_snapshot" text,
  "sender_avatar_url_snapshot" text
);

create table if not exists public."chat_moderation_actions" (
  "id" uuid default gen_random_uuid() not null,
  "hub_id" uuid not null,
  "room_id" uuid not null,
  "actor_id" uuid not null,
  "target_user_id" uuid,
  "target_message_id" uuid,
  "action_type" text not null,
  "reason" text,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_poll_options" (
  "id" uuid default gen_random_uuid() not null,
  "poll_id" uuid not null,
  "position" integer not null,
  "label" text not null
);

create table if not exists public."chat_poll_votes" (
  "id" uuid default gen_random_uuid() not null,
  "poll_id" uuid not null,
  "option_id" uuid not null,
  "user_id" uuid not null,
  "created_at" timestamp with time zone default now() not null,
  "room_id" uuid not null
);

create table if not exists public."chat_polls" (
  "id" uuid default gen_random_uuid() not null,
  "message_id" uuid not null,
  "question" text not null,
  "allow_multiple" boolean default false not null,
  "anonymous_voting" boolean default false not null,
  "closes_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_room_bans" (
  "id" uuid default gen_random_uuid() not null,
  "room_id" uuid not null,
  "user_id" uuid not null,
  "banned_by" uuid,
  "reason" text,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_room_invites" (
  "id" uuid default gen_random_uuid() not null,
  "room_id" uuid not null,
  "invited_user_id" uuid not null,
  "invited_by" uuid,
  "status" text default 'pending'::text not null,
  "token" text,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "responded_at" timestamp with time zone
);

create table if not exists public."chat_room_memberships" (
  "id" uuid default gen_random_uuid() not null,
  "room_id" uuid not null,
  "user_id" uuid not null,
  "role" text not null,
  "status" text default 'invited'::text not null,
  "invited_by" uuid,
  "joined_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_room_mutes" (
  "id" uuid default gen_random_uuid() not null,
  "room_id" uuid not null,
  "user_id" uuid not null,
  "muted_by" uuid,
  "muted_until" timestamp with time zone,
  "reason" text,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_room_typing" (
  "room_id" uuid not null,
  "user_id" uuid not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."chat_rooms" (
  "id" uuid default gen_random_uuid() not null,
  "hub_id" uuid not null,
  "name" text not null,
  "description" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "archived_at" timestamp with time zone,
  "retention_days" integer,
  "settings" jsonb default '{}'::jsonb not null
);
