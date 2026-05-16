-- Revocable/expiring hub join links + privacy-safe contact invites (email/phone).

-- -----------------------------------------------------------------------------
-- hub_join_links: tokenized join URLs for share/QR flows
-- -----------------------------------------------------------------------------
create table if not exists public.hub_join_links (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  token text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  disabled_at timestamptz,
  replaced_by uuid references public.hub_join_links(id) on delete set null,
  constraint hub_join_links_token_len check (char_length(token) >= 16 and char_length(token) <= 128)
);

create unique index if not exists hub_join_links_token_uidx on public.hub_join_links (token);
create index if not exists hub_join_links_hub_active_idx
  on public.hub_join_links (hub_id, created_at desc)
  where disabled_at is null;

alter table public.hub_join_links enable row level security;

drop policy if exists "Hub admins read join links" on public.hub_join_links;
create policy "Hub admins read join links"
  on public.hub_join_links for select
  using (
    exists (
      select 1 from public.hub_members m
      where m.hub_id = hub_join_links.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  );

-- Inserts/updates go through SECURITY DEFINER RPCs only.

-- -----------------------------------------------------------------------------
-- hub_contact_invites: outbound email/phone invites without user enumeration
-- -----------------------------------------------------------------------------
create table if not exists public.hub_contact_invites (
  id uuid primary key default gen_random_uuid(),
  hub_id uuid not null references public.hubs(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  contact_type text not null check (contact_type in ('email', 'phone')),
  contact_value text not null,
  contact_normalized text not null,
  status text not null default 'pending'
    check (status in ('pending', 'matched', 'revoked')),
  matched_user_id uuid references auth.users(id) on delete set null,
  hub_invitation_id uuid references public.hub_invitations(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint hub_contact_invites_value_len check (char_length(contact_normalized) >= 3)
);

create index if not exists hub_contact_invites_hub_idx
  on public.hub_contact_invites (hub_id, created_at desc);

create unique index if not exists hub_contact_invites_unique_pending
  on public.hub_contact_invites (hub_id, contact_type, contact_normalized)
  where status = 'pending';

alter table public.hub_contact_invites enable row level security;

drop policy if exists "Hub admins read contact invites" on public.hub_contact_invites;
create policy "Hub admins read contact invites"
  on public.hub_contact_invites for select
  using (
    exists (
      select 1 from public.hub_members m
      where m.hub_id = hub_contact_invites.hub_id
        and m.user_id = auth.uid()
        and m.role in ('creator', 'admin')
        and m.status = 'active'
    )
  );

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public._hub_is_admin(p_hub_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.hub_members m
    where m.hub_id = p_hub_id
      and m.user_id = p_user_id
      and m.role in ('creator', 'admin')
      and m.status = 'active'
  )
  or exists (
    select 1 from public.hubs h
    where h.id = p_hub_id
      and h.created_by = p_user_id::text
  );
$$;

revoke all on function public._hub_is_admin(uuid, uuid) from public;
grant execute on function public._hub_is_admin(uuid, uuid) to authenticated, service_role;

-- Uses gen_random_uuid() (core PG / Supabase) — gen_random_bytes requires pgcrypto.
create or replace function public._hub_join_link_token()
returns text
language sql
volatile
as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

-- Resolve a join token for the public join page (no admin-only fields leaked).
create or replace function public.hub_join_link_resolve(p_token text)
returns table (
  hub_id uuid,
  category text,
  slug text,
  hub_name text,
  is_valid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.hub_join_links%rowtype;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    return query select null::uuid, null::text, null::text, null::text, false;
    return;
  end if;

  select * into v_row
  from public.hub_join_links
  where token = trim(p_token)
  limit 1;

  if not found or v_row.disabled_at is not null then
    return query select null::uuid, null::text, null::text, null::text, false;
    return;
  end if;

  if v_row.expires_at is not null and v_row.expires_at <= now() then
    return query select null::uuid, null::text, null::text, null::text, false;
    return;
  end if;

  return query
  select h.id, h.category, h.slug, h.name, true
  from public.hubs h
  where h.id = v_row.hub_id;
end;
$$;

revoke all on function public.hub_join_link_resolve(text) from public;
grant execute on function public.hub_join_link_resolve(text) to anon, authenticated, service_role;

-- Admin: fetch or create the active join link for a hub.
create or replace function public.hub_join_link_get_or_create(
  p_hub_id uuid,
  p_expires_in_days integer default null
)
returns table (
  token text,
  expires_at timestamptz,
  disabled boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.hub_join_links%rowtype;
  v_expires timestamptz;
begin
  if v_uid is null or not public._hub_is_admin(p_hub_id, v_uid) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_expires := case
    when p_expires_in_days is null or p_expires_in_days <= 0 then null
    else now() + (p_expires_in_days || ' days')::interval
  end;

  select l.* into v_row
  from public.hub_join_links l
  where l.hub_id = p_hub_id
    and l.disabled_at is null
    and (l.expires_at is null or l.expires_at > now())
  order by l.created_at desc
  limit 1;

  if found then
    return query select v_row.token, v_row.expires_at, false::boolean;
    return;
  end if;

  insert into public.hub_join_links (hub_id, token, created_by, expires_at)
  values (p_hub_id, public._hub_join_link_token(), v_uid, v_expires)
  returning * into v_row;

  return query select v_row.token, v_row.expires_at, false::boolean;
end;
$$;

revoke all on function public.hub_join_link_get_or_create(uuid, integer) from public;
grant execute on function public.hub_join_link_get_or_create(uuid, integer) to authenticated;

create or replace function public.hub_join_link_regenerate(
  p_hub_id uuid,
  p_expires_in_days integer default null
)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old public.hub_join_links%rowtype;
  v_new public.hub_join_links%rowtype;
  v_expires timestamptz;
begin
  if v_uid is null or not public._hub_is_admin(p_hub_id, v_uid) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_expires := case
    when p_expires_in_days is null or p_expires_in_days <= 0 then null
    else now() + (p_expires_in_days || ' days')::interval
  end;

  update public.hub_join_links l
  set disabled_at = now()
  where l.hub_id = p_hub_id and l.disabled_at is null
  returning * into v_old;

  insert into public.hub_join_links (hub_id, token, created_by, expires_at, replaced_by)
  values (p_hub_id, public._hub_join_link_token(), v_uid, v_expires, v_old.id)
  returning * into v_new;

  return query select v_new.token, v_new.expires_at;
end;
$$;

revoke all on function public.hub_join_link_regenerate(uuid, integer) from public;
grant execute on function public.hub_join_link_regenerate(uuid, integer) to authenticated;

create or replace function public.hub_join_link_disable(p_hub_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public._hub_is_admin(p_hub_id, v_uid) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.hub_join_links
  set disabled_at = now()
  where hub_id = p_hub_id and disabled_at is null;
end;
$$;

revoke all on function public.hub_join_link_disable(uuid) from public;
grant execute on function public.hub_join_link_disable(uuid) to authenticated;

create or replace function public.hub_join_link_set_expiration(
  p_hub_id uuid,
  p_expires_in_days integer
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_expires timestamptz;
  v_row public.hub_join_links%rowtype;
begin
  if v_uid is null or not public._hub_is_admin(p_hub_id, v_uid) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select l.* into v_row
  from public.hub_join_links l
  where l.hub_id = p_hub_id and l.disabled_at is null
  order by l.created_at desc
  limit 1;

  if not found then
    raise exception 'no_active_link';
  end if;

  v_expires := case
    when p_expires_in_days is null or p_expires_in_days <= 0 then null
    else now() + (p_expires_in_days || ' days')::interval
  end;

  update public.hub_join_links l
  set expires_at = v_expires
  where l.id = v_row.id;

  return v_expires;
end;
$$;

revoke all on function public.hub_join_link_set_expiration(uuid, integer) from public;
grant execute on function public.hub_join_link_set_expiration(uuid, integer) to authenticated;

-- Privacy-safe contact invite: always succeeds from caller perspective.
create or replace function public.send_hub_contact_invite(
  p_hub_id uuid,
  p_contact_type text,
  p_contact_value text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_normalized text;
  v_user_id uuid;
  v_invitation_id uuid;
  v_contact_id uuid;
begin
  if v_uid is null or not public._hub_is_admin(p_hub_id, v_uid) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_contact_type not in ('email', 'phone') then
    raise exception 'invalid_contact_type';
  end if;

  if p_contact_type = 'email' then
    v_normalized := lower(trim(p_contact_value));
    if v_normalized !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
      raise exception 'invalid_email';
    end if;
    select p.id into v_user_id
    from public.profiles p
    where lower(coalesce(p.email, '')) = v_normalized
    limit 1;
  else
    v_normalized := regexp_replace(trim(p_contact_value), '[^0-9+]', '', 'g');
    if length(v_normalized) < 10 then
      raise exception 'invalid_phone';
    end if;
    v_user_id := null;
  end if;

  if v_user_id is not null then
    if exists (
      select 1 from public.hub_members m
      where m.hub_id = p_hub_id and m.user_id = v_user_id and m.status = 'active'
    ) then
      -- Generic success — do not reveal membership state to client.
      return jsonb_build_object('ok', true);
    end if;

    if not exists (
      select 1 from public.hub_invitations i
      where i.hub_id = p_hub_id and i.invited_user_id = v_user_id and i.status = 'pending'
    ) then
      insert into public.hub_invitations (hub_id, invited_user_id, invited_by, status)
      values (p_hub_id, v_user_id, v_uid, 'pending')
      returning id into v_invitation_id;
    end if;
  end if;

  insert into public.hub_contact_invites (
    hub_id, invited_by, contact_type, contact_value, contact_normalized,
    status, matched_user_id, hub_invitation_id
  )
  values (
    p_hub_id, v_uid, p_contact_type, trim(p_contact_value), v_normalized,
    case when v_user_id is not null then 'matched' else 'pending' end,
    v_user_id, v_invitation_id
  )
  on conflict do nothing;

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.send_hub_contact_invite(uuid, text, text) from public;
grant execute on function public.send_hub_contact_invite(uuid, text, text) to authenticated;
