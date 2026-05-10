-- Reporter-facing reason text, appeal placeholders, staff review notes.
-- Evidence rows stay soft-updated (status/resolver); no hard deletes here.

alter table public.chat_message_reports
  add column if not exists reason text;

alter table public.chat_message_reports
  add column if not exists appeal_status text not null default 'none'
    check (appeal_status in ('none', 'submitted', 'under_review', 'closed'));

alter table public.chat_message_reports
  add column if not exists appeal_body text;

alter table public.chat_message_reports
  add column if not exists appeal_submitted_at timestamptz;

alter table public.chat_message_reports
  add column if not exists review_notes_internal text;

comment on column public.chat_message_reports.reason is 'Human-readable report reason from the reporter (required on new reports in the app).';
comment on column public.chat_message_reports.appeal_status is 'Appeal lifecycle; reserved for future appeal UX.';
comment on column public.chat_message_reports.appeal_body is 'Reporter appeal text when appeals are enabled.';
comment on column public.chat_message_reports.review_notes_internal is 'Staff-only resolution notes; not shown to reporters.';
