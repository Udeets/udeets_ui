-- Sliding-window rate limit store for API routes (Next.js server → service_role RPC).
-- User JWT cannot call the RPC or read this table (RLS on, no policies; service_role bypasses RLS).

CREATE TABLE IF NOT EXISTS public.chat_rate_limit_hits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  rl_key text NOT NULL,
  hit_at timestamptz NOT NULL DEFAULT statement_timestamp()
);

CREATE INDEX IF NOT EXISTS chat_rate_limit_hits_rl_key_hit_at_idx
  ON public.chat_rate_limit_hits (rl_key, hit_at);

COMMENT ON TABLE public.chat_rate_limit_hits IS
  'Ephemeral per-key hit log for chat HTTP rate limits; pruned per request; optional global DELETE via cron.';

ALTER TABLE public.chat_rate_limit_hits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.chat_rate_limit_hits FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.chat_rate_limit_sliding_allow(
  p_key text,
  p_max integer,
  p_window_ms bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_cutoff timestamptz;
  v_count integer;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 OR length(p_key) > 512 THEN
    RETURN false;
  END IF;
  IF p_max < 1 OR p_max > 100000 THEN
    RETURN false;
  END IF;
  IF p_window_ms < 1000 OR p_window_ms > 86400000 THEN
    RETURN false;
  END IF;

  v_cutoff := v_now - (interval '1 millisecond' * p_window_ms::double precision);

  PERFORM pg_advisory_xact_lock(hashtext(p_key)::bigint);

  DELETE FROM public.chat_rate_limit_hits
  WHERE rl_key = p_key AND hit_at < v_cutoff;

  SELECT count(*)::integer INTO v_count
  FROM public.chat_rate_limit_hits
  WHERE rl_key = p_key;

  IF v_count >= p_max THEN
    RETURN false;
  END IF;

  INSERT INTO public.chat_rate_limit_hits (rl_key, hit_at)
  VALUES (p_key, v_now);

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.chat_rate_limit_sliding_allow(text, integer, bigint) IS
  'Atomically records one hit if under max for the sliding window; service_role only.';

REVOKE ALL ON FUNCTION public.chat_rate_limit_sliding_allow(text, integer, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_rate_limit_sliding_allow(text, integer, bigint) TO service_role;
