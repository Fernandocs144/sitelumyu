-- Reserve every allowed commercial-agent request atomically before OpenAI is called.
-- Qualification receives enough room to reach booking; tighter limits apply afterwards.

CREATE TABLE public.commercial_request_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.visitor_sessions(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64) NULL,
  request_phase VARCHAR(25) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_commercial_request_events_phase
    CHECK (request_phase IN ('qualification', 'post_qualification'))
);

CREATE INDEX idx_commercial_request_events_session_created
  ON public.commercial_request_events (session_id, created_at DESC);

CREATE INDEX idx_commercial_request_events_ip_created
  ON public.commercial_request_events (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;

CREATE INDEX idx_commercial_request_events_conversation_phase
  ON public.commercial_request_events (conversation_id, request_phase);

ALTER TABLE public.commercial_request_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.commercial_request_events FROM PUBLIC;
REVOKE ALL ON TABLE public.commercial_request_events FROM anon;
REVOKE ALL ON TABLE public.commercial_request_events FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.commercial_request_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.commercial_request_events_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.check_commercial_request_limits(
  p_session_id UUID,
  p_conversation_id UUID
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ip_hash VARCHAR(64);
  v_next_step TEXT;
  v_phase VARCHAR(25);
  v_session_limit INTEGER;
  v_ip_limit INTEGER;
  v_total_limit INTEGER;
  v_session_recent BIGINT;
  v_ip_recent BIGINT;
  v_phase_total BIGINT;
BEGIN
  SELECT vs.ip_hash, l.next_step
    INTO v_ip_hash, v_next_step
    FROM public.visitor_sessions AS vs
    LEFT JOIN public.leads AS l ON l.id = vs.lead_id
   WHERE vs.id = p_session_id
     AND vs.expires_at > now();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'invalid_session'::TEXT, 0;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.conversations AS c
     WHERE c.id = p_conversation_id
       AND c.session_id = p_session_id
       AND c.status = 'active'
  ) THEN
    RETURN QUERY SELECT false, 'invalid_conversation'::TEXT, 0;
    RETURN;
  END IF;

  v_phase := CASE
    WHEN v_next_step IN ('booking_pending', 'human_contact_requested', 'follow_up_later')
      THEN 'post_qualification'
    ELSE 'qualification'
  END;

  IF v_phase = 'qualification' THEN
    v_session_limit := 15;
    v_ip_limit := 30;
    v_total_limit := 30;
  ELSE
    v_session_limit := 5;
    v_ip_limit := 15;
    v_total_limit := 10;
  END IF;

  -- All callers acquire locks in the same order. The event insertion happens
  -- before the transaction releases them, so parallel requests cannot bypass counts.
  IF v_ip_hash IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('commercial-ip:' || v_ip_hash, 0));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('commercial-session:' || p_session_id::TEXT, 0));

  SELECT count(*)
    INTO v_session_recent
    FROM public.commercial_request_events AS e
   WHERE e.session_id = p_session_id
     AND e.created_at >= now() - interval '1 minute';

  IF v_session_recent >= v_session_limit THEN
    RETURN QUERY SELECT false, 'session_rate_limited'::TEXT, 60;
    RETURN;
  END IF;

  IF v_ip_hash IS NOT NULL THEN
    SELECT count(*)
      INTO v_ip_recent
      FROM public.commercial_request_events AS e
     WHERE e.ip_hash = v_ip_hash
       AND e.created_at >= now() - interval '1 minute';

    IF v_ip_recent >= v_ip_limit THEN
      RETURN QUERY SELECT false, 'ip_rate_limited'::TEXT, 60;
      RETURN;
    END IF;
  END IF;

  SELECT count(*)
    INTO v_phase_total
    FROM public.commercial_request_events AS e
   WHERE e.conversation_id = p_conversation_id
     AND e.request_phase = v_phase;

  IF v_phase_total >= v_total_limit THEN
    RETURN QUERY SELECT false, 'conversation_limit_reached'::TEXT, 0;
    RETURN;
  END IF;

  INSERT INTO public.commercial_request_events (
    session_id,
    conversation_id,
    ip_hash,
    request_phase
  ) VALUES (
    p_session_id,
    p_conversation_id,
    v_ip_hash,
    v_phase
  );

  RETURN QUERY SELECT true, 'allowed'::TEXT, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_commercial_request_limits(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_commercial_request_limits(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.check_commercial_request_limits(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_commercial_request_limits(UUID, UUID) TO service_role;

COMMENT ON TABLE public.commercial_request_events IS
  'Atomic request reservations used to protect commercial-agent OpenAI usage.';

COMMENT ON FUNCTION public.check_commercial_request_limits(UUID, UUID) IS
  'Atomically reserves an allowed request using qualification-aware limits.';
