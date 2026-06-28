-- Generated constraint DDL bundle

-- Pass 1: PK/UNIQUE/CHECK constraints

-- attachments

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'attachments'
      and con.conname = 'attachments_pkey'
  ) then
    alter table public."attachments" add constraint "attachments_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'attachments'
      and con.conname = 'attachments_file_type_check'
  ) then
    alter table public."attachments" add constraint "attachments_file_type_check" CHECK (file_type = ANY (ARRAY['image'::text, 'file'::text]));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'attachments'
      and con.conname = 'attachments_source_check'
  ) then
    alter table public."attachments" add constraint "attachments_source_check" CHECK (source = ANY (ARRAY['dp'::text, 'cover'::text, 'gallery'::text, 'deet'::text, 'admin_upload'::text, 'other'::text]));
  end if;
end $$;

-- chat_message_attachments

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_attachments'
      and con.conname = 'chat_message_attachments_pkey'
  ) then
    alter table public."chat_message_attachments" add constraint "chat_message_attachments_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_attachments'
      and con.conname = 'chat_message_attachments_file_size_bytes_check'
  ) then
    alter table public."chat_message_attachments" add constraint "chat_message_attachments_file_size_bytes_check" CHECK (file_size_bytes >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_attachments'
      and con.conname = 'chat_message_attachments_scan_status_check'
  ) then
    alter table public."chat_message_attachments" add constraint "chat_message_attachments_scan_status_check" CHECK (scan_status = ANY (ARRAY['pending'::text, 'skipped'::text, 'clean'::text, 'blocked'::text]));
  end if;
end $$;

-- chat_message_reactions

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reactions'
      and con.conname = 'chat_message_reactions_pkey'
  ) then
    alter table public."chat_message_reactions" add constraint "chat_message_reactions_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reactions'
      and con.conname = 'chat_message_reactions_unique'
  ) then
    alter table public."chat_message_reactions" add constraint "chat_message_reactions_unique" UNIQUE (message_id, user_id, emoji);
  end if;
end $$;

-- chat_message_reports

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_pkey'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_appeal_status_check'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_appeal_status_check" CHECK (appeal_status = ANY (ARRAY['none'::text, 'submitted'::text, 'under_review'::text, 'closed'::text]));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_status_check'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text]));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_target_chk'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_target_chk" CHECK (target_message_id IS NOT NULL OR target_user_id IS NOT NULL);
  end if;
end $$;

-- chat_messages

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_messages'
      and con.conname = 'chat_messages_pkey'
  ) then
    alter table public."chat_messages" add constraint "chat_messages_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_messages'
      and con.conname = 'chat_messages_message_kind_check'
  ) then
    alter table public."chat_messages" add constraint "chat_messages_message_kind_check" CHECK (message_kind = ANY (ARRAY['text'::text, 'media'::text, 'attachment'::text, 'poll'::text, 'system'::text]));
  end if;
end $$;

-- chat_moderation_actions

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_moderation_actions'
      and con.conname = 'chat_moderation_actions_pkey'
  ) then
    alter table public."chat_moderation_actions" add constraint "chat_moderation_actions_pkey" PRIMARY KEY (id);
  end if;
end $$;

-- chat_poll_options

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_options'
      and con.conname = 'chat_poll_options_pkey'
  ) then
    alter table public."chat_poll_options" add constraint "chat_poll_options_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_options'
      and con.conname = 'chat_poll_options_poll_position_unique'
  ) then
    alter table public."chat_poll_options" add constraint "chat_poll_options_poll_position_unique" UNIQUE (poll_id, "position");
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_options'
      and con.conname = 'chat_poll_options_position_check'
  ) then
    alter table public."chat_poll_options" add constraint "chat_poll_options_position_check" CHECK ("position" >= 0);
  end if;
end $$;

-- chat_poll_votes

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_votes'
      and con.conname = 'chat_poll_votes_pkey'
  ) then
    alter table public."chat_poll_votes" add constraint "chat_poll_votes_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_votes'
      and con.conname = 'chat_poll_votes_unique'
  ) then
    alter table public."chat_poll_votes" add constraint "chat_poll_votes_unique" UNIQUE (poll_id, user_id, option_id);
  end if;
end $$;

-- chat_polls

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_polls'
      and con.conname = 'chat_polls_pkey'
  ) then
    alter table public."chat_polls" add constraint "chat_polls_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_polls'
      and con.conname = 'chat_polls_message_id_key'
  ) then
    alter table public."chat_polls" add constraint "chat_polls_message_id_key" UNIQUE (message_id);
  end if;
end $$;

-- chat_room_bans

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_bans'
      and con.conname = 'chat_room_bans_pkey'
  ) then
    alter table public."chat_room_bans" add constraint "chat_room_bans_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_bans'
      and con.conname = 'chat_room_bans_room_user_unique'
  ) then
    alter table public."chat_room_bans" add constraint "chat_room_bans_room_user_unique" UNIQUE (room_id, user_id);
  end if;
end $$;

-- chat_room_invites

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_invites'
      and con.conname = 'chat_room_invites_pkey'
  ) then
    alter table public."chat_room_invites" add constraint "chat_room_invites_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_invites'
      and con.conname = 'chat_room_invites_token_key'
  ) then
    alter table public."chat_room_invites" add constraint "chat_room_invites_token_key" UNIQUE (token);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_invites'
      and con.conname = 'chat_room_invites_status_check'
  ) then
    alter table public."chat_room_invites" add constraint "chat_room_invites_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'revoked'::text, 'expired'::text]));
  end if;
end $$;

-- chat_room_memberships

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_memberships'
      and con.conname = 'chat_room_memberships_pkey'
  ) then
    alter table public."chat_room_memberships" add constraint "chat_room_memberships_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_memberships'
      and con.conname = 'chat_room_memberships_room_user_unique'
  ) then
    alter table public."chat_room_memberships" add constraint "chat_room_memberships_room_user_unique" UNIQUE (room_id, user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_memberships'
      and con.conname = 'chat_room_memberships_role_check'
  ) then
    alter table public."chat_room_memberships" add constraint "chat_room_memberships_role_check" CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text]));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_memberships'
      and con.conname = 'chat_room_memberships_status_check'
  ) then
    alter table public."chat_room_memberships" add constraint "chat_room_memberships_status_check" CHECK (status = ANY (ARRAY['invited'::text, 'active'::text, 'removed'::text, 'left'::text]));
  end if;
end $$;

-- chat_room_mutes

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_mutes'
      and con.conname = 'chat_room_mutes_pkey'
  ) then
    alter table public."chat_room_mutes" add constraint "chat_room_mutes_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_mutes'
      and con.conname = 'chat_room_mutes_room_user_unique'
  ) then
    alter table public."chat_room_mutes" add constraint "chat_room_mutes_room_user_unique" UNIQUE (room_id, user_id);
  end if;
end $$;

-- chat_room_typing

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_typing'
      and con.conname = 'chat_room_typing_pkey'
  ) then
    alter table public."chat_room_typing" add constraint "chat_room_typing_pkey" PRIMARY KEY (room_id, user_id);
  end if;
end $$;

-- chat_rooms

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_rooms'
      and con.conname = 'chat_rooms_pkey'
  ) then
    alter table public."chat_rooms" add constraint "chat_rooms_pkey" PRIMARY KEY (id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_rooms'
      and con.conname = 'chat_rooms_retention_days_allowed'
  ) then
    alter table public."chat_rooms" add constraint "chat_rooms_retention_days_allowed" CHECK (retention_days IS NULL OR (retention_days = ANY (ARRAY[30, 90, 365])));
  end if;
end $$;

-- Pass 2: FOREIGN KEY constraints

-- attachments

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'attachments'
      and con.conname = 'attachments_hub_id_fkey'
  ) then
    alter table public."attachments" add constraint "attachments_hub_id_fkey" FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_message_attachments

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_attachments'
      and con.conname = 'chat_message_attachments_message_id_fkey'
  ) then
    alter table public."chat_message_attachments" add constraint "chat_message_attachments_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_message_reactions

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reactions'
      and con.conname = 'chat_message_reactions_message_id_fkey'
  ) then
    alter table public."chat_message_reactions" add constraint "chat_message_reactions_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reactions'
      and con.conname = 'chat_message_reactions_room_id_fkey'
  ) then
    alter table public."chat_message_reactions" add constraint "chat_message_reactions_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_message_reports

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_hub_id_fkey'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_hub_id_fkey" FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_room_id_fkey'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_message_reports'
      and con.conname = 'chat_message_reports_target_message_id_fkey'
  ) then
    alter table public."chat_message_reports" add constraint "chat_message_reports_target_message_id_fkey" FOREIGN KEY (target_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;
  end if;
end $$;

-- chat_messages

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_messages'
      and con.conname = 'chat_messages_reply_to_id_fkey'
  ) then
    alter table public."chat_messages" add constraint "chat_messages_reply_to_id_fkey" FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id) ON DELETE SET NULL;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_messages'
      and con.conname = 'chat_messages_room_id_fkey'
  ) then
    alter table public."chat_messages" add constraint "chat_messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_moderation_actions

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_moderation_actions'
      and con.conname = 'chat_moderation_actions_hub_id_fkey'
  ) then
    alter table public."chat_moderation_actions" add constraint "chat_moderation_actions_hub_id_fkey" FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_moderation_actions'
      and con.conname = 'chat_moderation_actions_room_id_fkey'
  ) then
    alter table public."chat_moderation_actions" add constraint "chat_moderation_actions_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_moderation_actions'
      and con.conname = 'chat_moderation_actions_target_message_id_fkey'
  ) then
    alter table public."chat_moderation_actions" add constraint "chat_moderation_actions_target_message_id_fkey" FOREIGN KEY (target_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL;
  end if;
end $$;

-- chat_poll_options

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_options'
      and con.conname = 'chat_poll_options_poll_id_fkey'
  ) then
    alter table public."chat_poll_options" add constraint "chat_poll_options_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES chat_polls(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_poll_votes

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_votes'
      and con.conname = 'chat_poll_votes_option_id_fkey'
  ) then
    alter table public."chat_poll_votes" add constraint "chat_poll_votes_option_id_fkey" FOREIGN KEY (option_id) REFERENCES chat_poll_options(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_votes'
      and con.conname = 'chat_poll_votes_poll_id_fkey'
  ) then
    alter table public."chat_poll_votes" add constraint "chat_poll_votes_poll_id_fkey" FOREIGN KEY (poll_id) REFERENCES chat_polls(id) ON DELETE CASCADE;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_poll_votes'
      and con.conname = 'chat_poll_votes_room_id_fkey'
  ) then
    alter table public."chat_poll_votes" add constraint "chat_poll_votes_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_polls

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_polls'
      and con.conname = 'chat_polls_message_id_fkey'
  ) then
    alter table public."chat_polls" add constraint "chat_polls_message_id_fkey" FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_room_bans

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_bans'
      and con.conname = 'chat_room_bans_room_id_fkey'
  ) then
    alter table public."chat_room_bans" add constraint "chat_room_bans_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_room_invites

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_invites'
      and con.conname = 'chat_room_invites_room_id_fkey'
  ) then
    alter table public."chat_room_invites" add constraint "chat_room_invites_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_room_memberships

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_memberships'
      and con.conname = 'chat_room_memberships_room_id_fkey'
  ) then
    alter table public."chat_room_memberships" add constraint "chat_room_memberships_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_room_mutes

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_mutes'
      and con.conname = 'chat_room_mutes_room_id_fkey'
  ) then
    alter table public."chat_room_mutes" add constraint "chat_room_mutes_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_room_typing

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_room_typing'
      and con.conname = 'chat_room_typing_room_id_fkey'
  ) then
    alter table public."chat_room_typing" add constraint "chat_room_typing_room_id_fkey" FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE;
  end if;
end $$;

-- chat_rooms

do $$
begin
  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'chat_rooms'
      and con.conname = 'chat_rooms_hub_id_fkey'
  ) then
    alter table public."chat_rooms" add constraint "chat_rooms_hub_id_fkey" FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE CASCADE;
  end if;
end $$;
