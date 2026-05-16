-- Invite expiration for contact/member invites + US-only phone validation in RPC.

alter table public.hub_invitations
  add column if not exists expires_at timestamptz;

alter table public.hub_contact_invites
  add column if not exists expires_at timestamptz;

create index if not exists hub_invitations_pending_expires_idx
  on public.hub_invitations (invited_user_id, expires_at)
  where status = 'pending';

-- US NANP: optional leading 1, then 10 digits (area/exchange cannot start with 0 or 1).
create or replace function public._normalize_us_phone(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v_digits text;
  v_national text;
begin
  v_digits := regexp_replace(trim(coalesce(p_value, '')), '[^0-9]', '', 'g');
  if length(v_digits) = 10 then
    v_national := v_digits;
  elsif length(v_digits) = 11 and left(v_digits, 1) = '1' then
    v_national := substring(v_digits from 2);
  else
    return null;
  end if;

  if v_national !~ '^[2-9][0-9]{2}[2-9][0-9]{6}$' then
    return null;
  end if;

  return '+1' || v_national;
end;
$$;

drop function if exists public.send_hub_contact_invite(uuid, text, text);

create or replace function public.send_hub_contact_invite(
  p_hub_id uuid,
  p_contact_type text,
  p_contact_value text,
  p_expires_in_days integer default null
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
  v_expires timestamptz;
begin
  if v_uid is null or not public._hub_is_admin(p_hub_id, v_uid) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if p_contact_type not in ('email', 'phone') then
    raise exception 'invalid_contact_type';
  end if;

  v_expires := case
    when p_expires_in_days is null or p_expires_in_days <= 0 then null
    else now() + (p_expires_in_days || ' days')::interval
  end;

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
    v_normalized := public._normalize_us_phone(p_contact_value);
    if v_normalized is null then
      raise exception 'invalid_phone';
    end if;
    v_user_id := null;
  end if;

  if v_user_id is not null then
    if exists (
      select 1 from public.hub_members m
      where m.hub_id = p_hub_id and m.user_id = v_user_id and m.status = 'active'
    ) then
      return jsonb_build_object('ok', true);
    end if;

    select i.id into v_invitation_id
    from public.hub_invitations i
    where i.hub_id = p_hub_id
      and i.invited_user_id = v_user_id
      and i.status = 'pending'
      and (i.expires_at is null or i.expires_at > now())
    limit 1;

    if v_invitation_id is null then
      insert into public.hub_invitations (hub_id, invited_user_id, invited_by, status, expires_at)
      values (p_hub_id, v_user_id, v_uid, 'pending', v_expires)
      returning id into v_invitation_id;
    else
      update public.hub_invitations
      set expires_at = v_expires
      where id = v_invitation_id;
    end if;
  end if;

  insert into public.hub_contact_invites (
    hub_id, invited_by, contact_type, contact_value, contact_normalized,
    status, matched_user_id, hub_invitation_id, expires_at
  )
  values (
    p_hub_id, v_uid, p_contact_type, trim(p_contact_value), v_normalized,
    case when v_user_id is not null then 'matched' else 'pending' end,
    v_user_id, v_invitation_id, v_expires
  )
  on conflict do nothing;

  return jsonb_build_object('ok', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.send_hub_contact_invite(uuid, text, text, integer) from public;
grant execute on function public.send_hub_contact_invite(uuid, text, text, integer) to authenticated;

-- Invitee cannot accept expired invitations.
drop policy if exists "Invitee responds to own invitation" on public.hub_invitations;
create policy "Invitee responds to own invitation"
  on public.hub_invitations
  for update
  using (
    invited_user_id = auth.uid()
    and (expires_at is null or expires_at > now())
  )
  with check (
    invited_user_id = auth.uid()
    and status in ('accepted', 'declined')
  );
