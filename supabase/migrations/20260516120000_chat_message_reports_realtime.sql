-- Live updates for moderators (new reports) via Supabase Realtime.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_message_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reports;
  END IF;
END $$;
