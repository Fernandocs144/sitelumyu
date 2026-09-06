-- Detect abusive commercial-agent messages atomically before persistence and OpenAI.

CREATE TABLE public.commercial_abuse_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.visitor_sessions(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  severity VARCHAR(10) NOT NULL,
  outcome VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_commercial_abuse_attempts_severity
    CHECK (severity IN ('abusive', 'severe')),
  CONSTRAINT chk_commercial_abuse_attempts_outcome
    CHECK (outcome IN ('warning', 'closed'))
);

CREATE INDEX idx_commercial_abuse_attempts_lookup
  ON public.commercial_abuse_attempts (conversation_id, created_at DESC);

ALTER TABLE public.commercial_abuse_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.commercial_abuse_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.commercial_abuse_attempts FROM anon;
REVOKE ALL ON TABLE public.commercial_abuse_attempts FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.commercial_abuse_attempts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.commercial_abuse_attempts_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.check_commercial_message_abuse(
  p_session_id UUID,
  p_conversation_id UUID,
  p_severity VARCHAR(10)
)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_previous_abuse_count BIGINT;
  v_outcome VARCHAR(10);
BEGIN
  IF p_severity NOT IN ('abusive', 'severe') THEN
    RETURN QUERY SELECT false, 'invalid_severity'::TEXT;
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.visitor_sessions AS vs
      JOIN public.conversations AS c ON c.session_id = vs.id
     WHERE vs.id = p_session_id
       AND vs.expires_at > now()
       AND c.id = p_conversation_id
       AND c.status = 'active'
  ) THEN
    RETURN QUERY SELECT false, 'invalid_conversation'::TEXT;
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('commercial-abuse:' || p_conversation_id::TEXT, 0)
  );

  SELECT count(*)
    INTO v_previous_abuse_count
    FROM public.commercial_abuse_attempts AS a
   WHERE a.conversation_id = p_conversation_id;

  v_outcome := CASE
    WHEN p_severity = 'severe' OR v_previous_abuse_count >= 1 THEN 'closed'
    ELSE 'warning'
  END;

  INSERT INTO public.commercial_abuse_attempts (
    session_id,
    conversation_id,
    severity,
    outcome
  ) VALUES (
    p_session_id,
    p_conversation_id,
    p_severity,
    v_outcome
  );

  IF v_outcome = 'closed' THEN
    UPDATE public.conversations
       SET status = 'completed',
           commercial_stage = 'closed',
           primary_outcome = 'spam_detected',
           last_activity_at = now(),
           closed_at = now()
     WHERE id = p_conversation_id
       AND session_id = p_session_id
       AND status = 'active';

    RETURN QUERY SELECT false, 'abusive_message_limit_reached'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'abusive_message_warning'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_commercial_message_abuse(UUID, UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_commercial_message_abuse(UUID, UUID, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.check_commercial_message_abuse(UUID, UUID, VARCHAR) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_commercial_message_abuse(UUID, UUID, VARCHAR) TO service_role;

COMMENT ON TABLE public.commercial_abuse_attempts IS
  'Abusive message attempts blocked before message persistence and AI processing.';

COMMENT ON FUNCTION public.check_commercial_message_abuse(UUID, UUID, VARCHAR) IS
  'Warns on the first abusive message, closes on the second, and closes immediately for severe abuse.';
