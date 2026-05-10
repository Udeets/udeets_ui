-- Trusted erasure helper for account deletion / GDPR-style chat cleanup.
-- Invoked from the app with the Supabase service role only (not exposed to anon JWT).

create or replace function public.chat_erasure_apply_for_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_messages
  set
    sender_id = null,
    body = '[Content removed]',
    sender_display_name_snapshot = 'Deleted User',
    sender_avatar_url_snapshot = null
  where sender_id = p_user_id;

  delete from public.chat_message_reactions where user_id = p_user_id;
  delete from public.chat_poll_votes where user_id = p_user_id;

  update public.chat_message_reports
  set
    reason = null,
    details = null,
    reason_code = 'erasure',
    review_notes_internal = null,
    appeal_body = null
  where reporter_id = p_user_id;

  delete from public.chat_room_mutes where user_id = p_user_id;
  delete from public.chat_room_bans where user_id = p_user_id;

  update public.chat_message_attachments
  set
    deleted_at = coalesce(deleted_at, now()),
    original_filename = null,
    scan_status = 'skipped'
  where uploaded_by = p_user_id
    and deleted_at is null;
end;
$$;

revoke all on function public.chat_erasure_apply_for_user(uuid) from public;
grant execute on function public.chat_erasure_apply_for_user(uuid) to service_role;

comment on function public.chat_erasure_apply_for_user(uuid) is
  'Anonymizes chat content for a user; call from server with service role after verifying identity.';
