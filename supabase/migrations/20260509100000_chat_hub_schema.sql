-- -----------------------------------------------------------------------------
-- Hub-scoped chat: rooms, invite-only membership, messages, attachments,
-- reactions, polls (options + votes), reports, moderation audit, room invites.
-- Plain-text / safe-markdown bodies only — no HTML storage (enforced in app).
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- chat_rooms (ChatRoom): many per hub; belongs to one hub.
-- -----------------------------------------------------------------------------
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  retention_days integer check (retention_days is null or retention_days >= 1),
  settings jsonb not null default '{}'::jsonb
);

create index if not exists chat_rooms_hub_id_created_at_idx
  on public.chat_rooms (hub_id, created_at desc);

create index if not exists chat_rooms_hub_id_idx
  on public.chat_rooms (hub_id)
  where archived_at is null;

comment on table public.chat_rooms is 'Invite-only chat rooms under a hub.';
comment on column public.chat_rooms.retention_days is 'Optional retention window in days; null means no automatic purge in DB.';

-- -----------------------------------------------------------------------------
-- chat_room_invites (ChatInvite): pending invites to a room (separate from hub_invitations).
-- -----------------------------------------------------------------------------
create table if not exists public.chat_room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired')),
  token text unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create unique index if not exists chat_room_invites_unique_pending
  on public.chat_room_invites (room_id, invited_user_id)
  where status = 'pending';

create index if not exists chat_room_invites_invitee_status_idx
  on public.chat_room_invites (invited_user_id, status);

create index if not exists chat_room_invites_room_idx
  on public.chat_room_invites (room_id, status);

-- -----------------------------------------------------------------------------
-- chat_room_memberships (ChatRoomMembership): roles owner / admin / moderator / member.
-- -----------------------------------------------------------------------------
create table if not exists public.chat_room_memberships (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('owner', 'admin', 'moderator', 'member')),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'removed', 'left')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  constraint chat_room_memberships_room_user_unique unique (room_id, user_id)
);

create unique index if not exists chat_room_memberships_one_active_owner
  on public.chat_room_memberships (room_id)
  where role = 'owner' and status = 'active';

create index if not exists chat_room_memberships_room_user_idx
  on public.chat_room_memberships (room_id, user_id);

create index if not exists chat_room_memberships_user_room_idx
  on public.chat_room_memberships (user_id, room_id)
  where status = 'active';

create index if not exists chat_room_memberships_room_status_idx
  on public.chat_room_memberships (room_id, status);

-- -----------------------------------------------------------------------------
-- chat_messages (Message)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  message_kind text not null
    check (message_kind in ('text', 'media', 'attachment', 'poll', 'system')),
  body text,
  reply_to_id uuid references public.chat_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  moderation_reason text,
  sender_display_name_snapshot text,
  sender_avatar_url_snapshot text
);

create index if not exists chat_messages_room_created_at_idx
  on public.chat_messages (room_id, created_at desc);

create index if not exists chat_messages_room_created_at_active_idx
  on public.chat_messages (room_id, created_at desc)
  where deleted_at is null;

create index if not exists chat_messages_reply_to_idx
  on public.chat_messages (reply_to_id)
  where reply_to_id is not null;

comment on column public.chat_messages.body is 'Plain text or safe-markdown pipeline only; never trusted HTML.';
comment on column public.chat_messages.sender_display_name_snapshot is 'Denormalized for display after account anonymization.';

-- -----------------------------------------------------------------------------
-- chat_message_attachments (MessageAttachment)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  original_filename text,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'skipped', 'clean', 'blocked')),
  uploaded_by uuid not null references auth.users(id) on delete set null
);

create index if not exists chat_message_attachments_message_id_idx
  on public.chat_message_attachments (message_id);

-- -----------------------------------------------------------------------------
-- chat_message_reactions (MessageReaction)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint chat_message_reactions_unique unique (message_id, user_id, emoji)
);

create index if not exists chat_message_reactions_message_idx
  on public.chat_message_reactions (message_id);

-- -----------------------------------------------------------------------------
-- chat_polls (Poll)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_polls (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null unique references public.chat_messages(id) on delete cascade,
  question text not null,
  allow_multiple boolean not null default false,
  anonymous_voting boolean not null default false,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists chat_polls_message_id_idx
  on public.chat_polls (message_id);

comment on column public.chat_polls.anonymous_voting is 'When true, hide per-voter identity from non-moderators in API; user_id retained for integrity.';

-- -----------------------------------------------------------------------------
-- chat_poll_options (PollOption)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.chat_polls(id) on delete cascade,
  position integer not null check ("position" >= 0),
  label text not null,
  constraint chat_poll_options_poll_position_unique unique (poll_id, "position")
);

create index if not exists chat_poll_options_poll_id_idx
  on public.chat_poll_options (poll_id, "position");

-- -----------------------------------------------------------------------------
-- chat_poll_votes (PollVote)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.chat_polls(id) on delete cascade,
  option_id uuid not null references public.chat_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chat_poll_votes_unique unique (poll_id, user_id, option_id)
);

create index if not exists chat_poll_votes_poll_user_idx
  on public.chat_poll_votes (poll_id, user_id);

create index if not exists chat_poll_votes_option_idx
  on public.chat_poll_votes (option_id);

-- -----------------------------------------------------------------------------
-- chat_message_reports (MessageReport)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_message_reports (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_message_id uuid references public.chat_messages(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  reason_code text,
  details text,
  status text not null default 'pending'
    check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolver_id uuid references auth.users(id) on delete set null,
  constraint chat_message_reports_target_chk
    check (target_message_id is not null or target_user_id is not null)
);

create index if not exists chat_message_reports_status_created_idx
  on public.chat_message_reports (status, created_at desc);

create index if not exists chat_message_reports_room_idx
  on public.chat_message_reports (room_id, status);

create index if not exists chat_message_reports_reporter_idx
  on public.chat_message_reports (reporter_id);

-- -----------------------------------------------------------------------------
-- chat_moderation_actions (ModerationAction)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_message_id uuid references public.chat_messages(id) on delete set null,
  action_type text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_moderation_actions_room_created_idx
  on public.chat_moderation_actions (room_id, created_at desc);

create index if not exists chat_moderation_actions_hub_created_idx
  on public.chat_moderation_actions (hub_id, created_at desc);

create index if not exists chat_moderation_actions_actor_idx
  on public.chat_moderation_actions (actor_id, created_at desc);

comment on table public.chat_moderation_actions is 'Append-only moderation audit; avoid updates/deletes in application layer.';

-- =============================================================================
-- RLS — chat_rooms
-- =============================================================================
alter table public.chat_rooms enable row level security;

drop policy if exists "chat_rooms_select_hub_staff_or_member" on public.chat_rooms;
create policy "chat_rooms_select_hub_staff_or_member"
  on public.chat_rooms for select to authenticated
  using (
    exists (
      select 1 from public.hub_members hm
      where hm.hub_id = chat_rooms.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_rooms.id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_rooms_insert_hub_staff" on public.chat_rooms;
create policy "chat_rooms_insert_hub_staff"
  on public.chat_rooms for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.hub_members hm
      where hm.hub_id = chat_rooms.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_rooms_update_hub_staff_or_room_admin" on public.chat_rooms;
create policy "chat_rooms_update_hub_staff_or_room_admin"
  on public.chat_rooms for update to authenticated
  using (
    exists (
      select 1 from public.hub_members hm
      where hm.hub_id = chat_rooms.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_rooms.id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin')
    )
  );

-- =============================================================================
-- RLS — chat_room_invites
-- =============================================================================
alter table public.chat_room_invites enable row level security;

drop policy if exists "chat_room_invites_select_invitee_or_staff" on public.chat_room_invites;
create policy "chat_room_invites_select_invitee_or_staff"
  on public.chat_room_invites for select to authenticated
  using (
    invited_user_id = auth.uid()
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_invites.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_invites.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
  );

drop policy if exists "chat_room_invites_insert_staff" on public.chat_room_invites;
create policy "chat_room_invites_insert_staff"
  on public.chat_room_invites for insert to authenticated
  with check (
    invited_by = auth.uid()
    and (
      exists (
        select 1 from public.chat_rooms r
        join public.hub_members hm on hm.hub_id = r.hub_id
        where r.id = chat_room_invites.room_id
          and hm.user_id = auth.uid()
          and hm.role in ('creator', 'admin')
          and hm.status = 'active'
      )
      or exists (
        select 1 from public.chat_room_memberships crm
        where crm.room_id = chat_room_invites.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
          and crm.role in ('owner', 'admin', 'moderator')
      )
    )
  );

drop policy if exists "chat_room_invites_update_invitee" on public.chat_room_invites;
create policy "chat_room_invites_update_invitee"
  on public.chat_room_invites for update to authenticated
  using (invited_user_id = auth.uid())
  with check (
    invited_user_id = auth.uid()
    and status in ('accepted', 'declined')
  );

drop policy if exists "chat_room_invites_update_staff_revoke" on public.chat_room_invites;
create policy "chat_room_invites_update_staff_revoke"
  on public.chat_room_invites for update to authenticated
  using (
    exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_invites.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_invites.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
  )
  with check (status in ('revoked', 'expired'));

-- =============================================================================
-- RLS — chat_room_memberships
-- =============================================================================
alter table public.chat_room_memberships enable row level security;

drop policy if exists "chat_room_memberships_select_self_or_staff" on public.chat_room_memberships;
create policy "chat_room_memberships_select_self_or_staff"
  on public.chat_room_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_memberships.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_memberships.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_room_memberships_insert_staff" on public.chat_room_memberships;
create policy "chat_room_memberships_insert_staff"
  on public.chat_room_memberships for insert to authenticated
  with check (
    exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_memberships.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_memberships.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
          and crm.role in ('owner', 'admin', 'moderator')
    )
  );

drop policy if exists "chat_room_memberships_update_self_or_staff" on public.chat_room_memberships;
create policy "chat_room_memberships_update_self_or_staff"
  on public.chat_room_memberships for update to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_room_memberships.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_room_memberships.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
  );

-- =============================================================================
-- RLS — chat_messages
-- =============================================================================
alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_room_members" on public.chat_messages;
create policy "chat_messages_select_room_members"
  on public.chat_messages for select to authenticated
  using (
    exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_messages.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_messages.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_messages_insert_room_members" on public.chat_messages;
create policy "chat_messages_insert_room_members"
  on public.chat_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_messages.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_messages_insert_system_staff" on public.chat_messages;
create policy "chat_messages_insert_system_staff"
  on public.chat_messages for insert to authenticated
  with check (
    message_kind = 'system'
    and sender_id is null
    and (
      exists (
        select 1 from public.chat_room_memberships crm
        where crm.room_id = chat_messages.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
          and crm.role in ('owner', 'admin', 'moderator')
      )
      or exists (
        select 1 from public.chat_rooms r
        join public.hub_members hm on hm.hub_id = r.hub_id
        where r.id = chat_messages.room_id
          and hm.user_id = auth.uid()
          and hm.role in ('creator', 'admin')
          and hm.status = 'active'
      )
    )
  );

drop policy if exists "chat_messages_update_own_or_mod" on public.chat_messages;
create policy "chat_messages_update_own_or_mod"
  on public.chat_messages for update to authenticated
  using (
    (
      sender_id = auth.uid()
      and exists (
        select 1 from public.chat_room_memberships crm
        where crm.room_id = chat_messages.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
      )
    )
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_messages.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.chat_rooms r
      join public.hub_members hm on hm.hub_id = r.hub_id
      where r.id = chat_messages.room_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

-- =============================================================================
-- RLS — chat_message_attachments
-- =============================================================================
alter table public.chat_message_attachments enable row level security;

drop policy if exists "chat_message_attachments_select_room_members" on public.chat_message_attachments;
create policy "chat_message_attachments_select_room_members"
  on public.chat_message_attachments for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where m.id = chat_message_attachments.message_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
    or exists (
      select 1 from public.chat_messages m
      join public.chat_rooms r on r.id = m.room_id
      join public.hub_members hm on hm.hub_id = r.hub_id
      where m.id = chat_message_attachments.message_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_message_attachments_insert_uploader_member" on public.chat_message_attachments;
create policy "chat_message_attachments_insert_uploader_member"
  on public.chat_message_attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.chat_messages m
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where m.id = chat_message_attachments.message_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

-- =============================================================================
-- RLS — chat_message_reactions
-- =============================================================================
alter table public.chat_message_reactions enable row level security;

drop policy if exists "chat_message_reactions_select_room_members" on public.chat_message_reactions;
create policy "chat_message_reactions_select_room_members"
  on public.chat_message_reactions for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where m.id = chat_message_reactions.message_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_message_reactions_mutate_own" on public.chat_message_reactions;
create policy "chat_message_reactions_mutate_own"
  on public.chat_message_reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.chat_messages m
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where m.id = chat_message_reactions.message_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_message_reactions_delete_own" on public.chat_message_reactions;
create policy "chat_message_reactions_delete_own"
  on public.chat_message_reactions for delete to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- RLS — chat_polls / chat_poll_options / chat_poll_votes
-- =============================================================================
alter table public.chat_polls enable row level security;

drop policy if exists "chat_polls_select_room_members" on public.chat_polls;
create policy "chat_polls_select_room_members"
  on public.chat_polls for select to authenticated
  using (
    exists (
      select 1 from public.chat_messages m
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where m.id = chat_polls.message_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_polls_insert_message_author" on public.chat_polls;
create policy "chat_polls_insert_message_author"
  on public.chat_polls for insert to authenticated
  with check (
    exists (
      select 1 from public.chat_messages m
      where m.id = chat_polls.message_id
        and m.sender_id = auth.uid()
        and m.message_kind = 'poll'
    )
  );

alter table public.chat_poll_options enable row level security;

drop policy if exists "chat_poll_options_select_room_members" on public.chat_poll_options;
create policy "chat_poll_options_select_room_members"
  on public.chat_poll_options for select to authenticated
  using (
    exists (
      select 1 from public.chat_polls p
      join public.chat_messages m on m.id = p.message_id
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where p.id = chat_poll_options.poll_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_poll_options_insert_poll_creator" on public.chat_poll_options;
create policy "chat_poll_options_insert_poll_creator"
  on public.chat_poll_options for insert to authenticated
  with check (
    exists (
      select 1 from public.chat_polls p
      join public.chat_messages m on m.id = p.message_id
      where p.id = chat_poll_options.poll_id
        and m.sender_id = auth.uid()
    )
  );

alter table public.chat_poll_votes enable row level security;

drop policy if exists "chat_poll_votes_select_room_members" on public.chat_poll_votes;
create policy "chat_poll_votes_select_room_members"
  on public.chat_poll_votes for select to authenticated
  using (
    exists (
      select 1 from public.chat_polls p
      join public.chat_messages m on m.id = p.message_id
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where p.id = chat_poll_votes.poll_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_poll_votes_insert_own" on public.chat_poll_votes;
create policy "chat_poll_votes_insert_own"
  on public.chat_poll_votes for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.chat_polls p
      join public.chat_messages m on m.id = p.message_id
      join public.chat_room_memberships crm on crm.room_id = m.room_id
      where p.id = chat_poll_votes.poll_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_poll_votes_delete_own" on public.chat_poll_votes;
create policy "chat_poll_votes_delete_own"
  on public.chat_poll_votes for delete to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- RLS — chat_message_reports
-- =============================================================================
alter table public.chat_message_reports enable row level security;

drop policy if exists "chat_message_reports_select_reporter_or_mod" on public.chat_message_reports;
create policy "chat_message_reports_select_reporter_or_mod"
  on public.chat_message_reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_message_reports.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.hub_members hm
      where hm.hub_id = chat_message_reports.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_message_reports_insert_reporter_member" on public.chat_message_reports;
create policy "chat_message_reports_insert_reporter_member"
  on public.chat_message_reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_message_reports.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
    )
  );

drop policy if exists "chat_message_reports_update_mod" on public.chat_message_reports;
create policy "chat_message_reports_update_mod"
  on public.chat_message_reports for update to authenticated
  using (
    exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_message_reports.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.hub_members hm
      where hm.hub_id = chat_message_reports.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

-- =============================================================================
-- RLS — chat_moderation_actions
-- =============================================================================
alter table public.chat_moderation_actions enable row level security;

drop policy if exists "chat_moderation_actions_select_staff" on public.chat_moderation_actions;
create policy "chat_moderation_actions_select_staff"
  on public.chat_moderation_actions for select to authenticated
  using (
    exists (
      select 1 from public.chat_room_memberships crm
      where crm.room_id = chat_moderation_actions.room_id
        and crm.user_id = auth.uid()
        and crm.status = 'active'
        and crm.role in ('owner', 'admin', 'moderator')
    )
    or exists (
      select 1 from public.hub_members hm
      where hm.hub_id = chat_moderation_actions.hub_id
        and hm.user_id = auth.uid()
        and hm.role in ('creator', 'admin')
        and hm.status = 'active'
    )
  );

drop policy if exists "chat_moderation_actions_insert_staff" on public.chat_moderation_actions;
create policy "chat_moderation_actions_insert_staff"
  on public.chat_moderation_actions for insert to authenticated
  with check (
    actor_id = auth.uid()
    and (
      exists (
        select 1 from public.chat_room_memberships crm
        where crm.room_id = chat_moderation_actions.room_id
          and crm.user_id = auth.uid()
          and crm.status = 'active'
          and crm.role in ('owner', 'admin', 'moderator')
      )
      or exists (
        select 1 from public.hub_members hm
        where hm.hub_id = chat_moderation_actions.hub_id
          and hm.user_id = auth.uid()
          and hm.role in ('creator', 'admin')
          and hm.status = 'active'
      )
    )
  );
