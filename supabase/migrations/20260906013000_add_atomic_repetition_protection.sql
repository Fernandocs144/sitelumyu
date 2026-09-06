-- Detect repeated commercial-agent messages atomically before persistence and OpenAI.

CREATE TABLE public.commercial_message_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.visitor_sessions(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_fingerprint VARCHAR(64) NOT NULL,
  outcome VARCHAR(25) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_commercial_message_attempts_fingerprint
    CHECK (message_fingerprint ~ '^[0-9a-f]{64}$'),
  CONSTRAINT chk_commercial_message_attempts_outcome
    CHECK (outcome IN ('allowed', 'warning', 'closed'))
);

CREATE INDEX idx_commercial_message_attempts_lookup
  ON public.commercial_message_attempts (
    conversation_id,
    message_fingerprint,
    created_at DESC
  );

ALTER TABLE public.commercial_message_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.commercial_message_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.commercial_message_attempts FROM anon;
REVOKE ALL ON TABLE public.commercial_message_attempts FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.commercial_message_attempts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.commercial_message_attempts_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.check_commercial_message_repetition(
  p_session_id UUID,
  p_conversation_id UUID,
  p_message_fingerprint VARCHAR(64)
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
  v_repeat_count BIGINT;
BEGIN
  IF p_message_fingerprint IS NULL
     OR p_message_fingerprint !~ '^[0-9a-f]{64}$' THEN
    RETURN QUERY SELECT false, 'invalid_fingerprint'::TEXT;
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
    hashtextextended('commercial-repetition:' || p_conversation_id::TEXT, 0)
  );

  SELECT count(*)
    INTO v_repeat_count
    FROM public.commercial_message_attempts AS a
   WHERE a.conversation_id = p_conversation_id
     AND a.message_fingerprint = p_message_fingerprint
     AND a.created_at >= now() - interval '10 minutes';

  IF v_repeat_count < 2 THEN
    INSERT INTO public.commercial_message_attempts (
      session_id,
      conversation_id,
      message_fingerprint,
      outcome
    ) VALUES (
      p_session_id,
      p_conversation_id,
      p_message_fingerprint,
      'allowed'
    );

    RETURN QUERY SELECT true, 'allowed'::TEXT;
    RETURN;
  END IF;

  IF v_repeat_count = 2 THEN
    INSERT INTO public.commercial_message_attempts (
      session_id,
      conversation_id,
      message_fingerprint,
      outcome
    ) VALUES (
      p_session_id,
      p_conversation_id,
      p_message_fingerprint,
      'warning'
    );

    RETURN QUERY SELECT false, 'repeated_message_warning'::TEXT;
    RETURN;
  END IF;

  INSERT INTO public.commercial_message_attempts (
    session_id,
    conversation_id,
    message_fingerprint,
    outcome
  ) VALUES (
    p_session_id,
    p_conversation_id,
    p_message_fingerprint,
    'closed'
  );

  UPDATE public.conversations
     SET status = 'completed',
         commercial_stage = 'closed',
         primary_outcome = 'spam_detected',
         last_activity_at = now(),
         closed_at = now()
   WHERE id = p_conversation_id
     AND session_id = p_session_id
     AND status = 'active';

  RETURN QUERY SELECT false, 'repeated_message_limit_reached'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_commercial_message_repetition(UUID, UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_commercial_message_repetition(UUID, UUID, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.check_commercial_message_repetition(UUID, UUID, VARCHAR) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_commercial_message_repetition(UUID, UUID, VARCHAR) TO service_role;

COMMENT ON TABLE public.commercial_message_attempts IS
  'Normalized message attempts used for atomic repetition protection.';

COMMENT ON FUNCTION public.check_commercial_message_repetition(UUID, UUID, VARCHAR) IS
  'Allows two equivalent messages, warns on the third, and closes on the fourth within ten minutes.';
