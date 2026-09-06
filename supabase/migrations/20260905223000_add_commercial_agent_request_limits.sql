-- Apply commercial-agent limits before messages are persisted or sent to OpenAI.
-- The API calls this function with the service-role client.

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_ip_hash
  ON public.visitor_sessions (ip_hash)
  WHERE ip_hash IS NOT NULL;

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
  v_session_recent BIGINT;
  v_ip_recent BIGINT;
  v_conversation_total BIGINT;
BEGIN
  SELECT vs.ip_hash
    INTO v_ip_hash
    FROM public.visitor_sessions AS vs
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

  SELECT count(*)
    INTO v_session_recent
    FROM public.messages AS m
    JOIN public.conversations AS c ON c.id = m.conversation_id
   WHERE c.session_id = p_session_id
     AND m.sender_role = 'visitor'
     AND m.created_at >= now() - interval '1 minute';

  IF v_session_recent >= 8 THEN
    RETURN QUERY SELECT false, 'session_rate_limited'::TEXT, 60;
    RETURN;
  END IF;

  IF v_ip_hash IS NOT NULL THEN
    SELECT count(*)
      INTO v_ip_recent
      FROM public.messages AS m
      JOIN public.conversations AS c ON c.id = m.conversation_id
      JOIN public.visitor_sessions AS vs ON vs.id = c.session_id
     WHERE vs.ip_hash = v_ip_hash
       AND m.sender_role = 'visitor'
       AND m.created_at >= now() - interval '1 minute';

    IF v_ip_recent >= 20 THEN
      RETURN QUERY SELECT false, 'ip_rate_limited'::TEXT, 60;
      RETURN;
    END IF;
  END IF;

  SELECT count(*)
    INTO v_conversation_total
    FROM public.messages AS m
   WHERE m.conversation_id = p_conversation_id
     AND m.sender_role = 'visitor';

  IF v_conversation_total >= 40 THEN
    RETURN QUERY SELECT false, 'conversation_limit_reached'::TEXT, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'allowed'::TEXT, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_commercial_request_limits(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_commercial_request_limits(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.check_commercial_request_limits(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_commercial_request_limits(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.check_commercial_request_limits(UUID, UUID) IS
  'Checks commercial-agent per-session, per-IP and per-conversation visitor-message limits.';
