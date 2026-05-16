-- Fix: RETURNS TABLE output columns shadow table columns in PL/pgSQL (expires_at ambiguous).

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
