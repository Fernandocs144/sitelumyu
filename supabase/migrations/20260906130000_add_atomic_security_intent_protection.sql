-- Block prompt-injection and clearly off-topic attempts before persistence and AI processing.

CREATE TABLE public.commercial_security_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.visitor_sessions(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  category VARCHAR(20) NOT NULL,
  outcome VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_commercial_security_attempts_category
    CHECK (category IN ('prompt_injection', 'off_topic')),
  CONSTRAINT chk_commercial_security_attempts_outcome
    CHECK (outcome IN ('warning', 'redirect', 'closed'))
);

CREATE INDEX idx_commercial_security_attempts_lookup
  ON public.commercial_security_attempts (conversation_id, category, created_at DESC);

ALTER TABLE public.commercial_security_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.commercial_security_attempts FROM PUBLIC;
REVOKE ALL ON TABLE public.commercial_security_attempts FROM anon;
REVOKE ALL ON TABLE public.commercial_security_attempts FROM authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.commercial_security_attempts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.commercial_security_attempts_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.check_commercial_security_intent(
  p_session_id UUID,
  p_conversation_id UUID,
  p_category VARCHAR(20)
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
  v_previous_category_count BIGINT;
  v_outcome VARCHAR(10);
  v_reason TEXT;
BEGIN
  IF p_category NOT IN ('prompt_injection', 'off_topic') THEN
    RETURN QUERY SELECT false, 'invalid_category'::TEXT;
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
    hashtextextended('commercial-security:' || p_conversation_id::TEXT, 0)
  );

  SELECT count(*)
    INTO v_previous_category_count
    FROM public.commercial_security_attempts AS a
   WHERE a.conversation_id = p_conversation_id
     AND a.category = p_category;

  v_outcome := CASE
    WHEN v_previous_category_count >= 1 THEN 'closed'
    WHEN p_category = 'prompt_injection' THEN 'warning'
    ELSE 'redirect'
  END;

  INSERT INTO public.commercial_security_attempts (
    session_id,
    conversation_id,
    category,
    outcome
  ) VALUES (
    p_session_id,
    p_conversation_id,
    p_category,
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

    v_reason := CASE
      WHEN p_category = 'prompt_injection' THEN 'prompt_injection_limit_reached'
      ELSE 'off_topic_limit_reached'
    END;

    RETURN QUERY SELECT false, v_reason;
    RETURN;
  END IF;

  v_reason := CASE
    WHEN p_category = 'prompt_injection' THEN 'prompt_injection_warning'
    ELSE 'off_topic_redirect'
  END;

  RETURN QUERY SELECT false, v_reason;
END;
$$;

REVOKE ALL ON FUNCTION public.check_commercial_security_intent(UUID, UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_commercial_security_intent(UUID, UUID, VARCHAR) FROM anon;
REVOKE ALL ON FUNCTION public.check_commercial_security_intent(UUID, UUID, VARCHAR) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_commercial_security_intent(UUID, UUID, VARCHAR) TO service_role;

COMMENT ON TABLE public.commercial_security_attempts IS
  'Prompt-injection and clearly off-topic attempts blocked before persistence and AI processing.';

COMMENT ON FUNCTION public.check_commercial_security_intent(UUID, UUID, VARCHAR) IS
  'Warns or redirects on the first attempt in each category and closes on the second.';
