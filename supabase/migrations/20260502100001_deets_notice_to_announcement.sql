-- Consolidate legacy Notice deets into Announcement shape (Posts + announcement attachment).
-- Does not auto-set pinToTop; hubs can pin manually in composer settings.

update public.deets d
set
  kind = case when d.kind = 'Notices' then 'Posts' else d.kind end,
  attachments = case
    when d.attachments is null then d.attachments
    when exists (
      select 1 from jsonb_array_elements(d.attachments) e where e->>'type' = 'notice'
    ) then (
      select jsonb_agg(
        case
          when (elem->>'type') = 'notice' then jsonb_set(elem, '{type}', '"announcement"', true)
          else elem
        end
        order by ord
      )
      from jsonb_array_elements(d.attachments) with ordinality as t(elem, ord)
    )
    else d.attachments
  end
where
  d.kind = 'Notices'
  or (
    d.attachments is not null
    and exists (select 1 from jsonb_array_elements(d.attachments) e where e->>'type' = 'notice')
  );
