-- Keep qualification usable while ending token consumption shortly after booking is offered.

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
    v_session_limit := 12;
    v_ip_limit := 30;
    v_total_limit := 20;
  ELSE
    v_session_limit := 3;
    v_ip_limit := 15;
    v_total_limit := 3;
  END IF;

  IF v_ip_hash IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('commercial-ip:' || v_ip_hash, 0));
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('commercial-session:' || p_session_id::TEXT, 0));

  SELECT count(*)
    INTO v_phase_total
    FROM public.commercial_request_events AS e
   WHERE e.conversation_id = p_conversation_id
     AND e.request_phase = v_phase;

  IF v_phase_total >= v_total_limit THEN
    RETURN QUERY SELECT false,
      CASE
        WHEN v_phase = 'post_qualification'
          THEN 'post_qualification_limit_reached'::TEXT
        ELSE 'conversation_limit_reached'::TEXT
      END,
      0;
    RETURN;
  END IF;

  SELECT count(*)
    INTO v_session_recent
    FROM public.commercial_request_events AS e
   WHERE e.session_id = p_session_id
     AND e.request_phase = v_phase
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
       AND e.request_phase = v_phase
       AND e.created_at >= now() - interval '1 minute';

    IF v_ip_recent >= v_ip_limit THEN
      RETURN QUERY SELECT false, 'ip_rate_limited'::TEXT, 60;
      RETURN;
    END IF;
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

COMMENT ON FUNCTION public.check_commercial_request_limits(UUID, UUID) IS
  'Atomically reserves requests: 20 during qualification and 3 after qualification.';
