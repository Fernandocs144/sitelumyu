-- Start a separate commercial project without mixing the previous lead,
-- conversation history, or booking state into the new project.

CREATE OR REPLACE FUNCTION public.start_separate_commercial_project(
  p_session_id UUID,
  p_current_conversation_id UUID,
  p_visitor_message_id UUID,
  p_language VARCHAR,
  p_primary_service VARCHAR DEFAULT NULL,
  p_service_variant VARCHAR DEFAULT NULL,
  p_secondary_services JSONB DEFAULT '[]'::JSONB,
  p_need_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_old_lead_id UUID;
  v_new_lead_id UUID;
  v_new_conversation_id UUID;
  v_contact_name VARCHAR(120);
  v_contact_email VARCHAR(200);
BEGIN
  IF p_language NOT IN ('pt', 'en') THEN
    RAISE EXCEPTION 'invalid_language' USING ERRCODE = '22023';
  END IF;

  IF p_primary_service IS NOT NULL
     AND p_primary_service NOT IN ('websites', 'automation', 'ai', 'digital_growth') THEN
    RAISE EXCEPTION 'invalid_primary_service' USING ERRCODE = '22023';
  END IF;

  IF p_service_variant IS NOT NULL
     AND (p_primary_service <> 'websites'
       OR p_service_variant NOT IN ('landing_page', 'institutional_website', 'custom_website', 'ecommerce')) THEN
    RAISE EXCEPTION 'invalid_service_variant' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(COALESCE(p_secondary_services, '[]'::JSONB)) <> 'array' THEN
    RAISE EXCEPTION 'invalid_secondary_services' USING ERRCODE = '22023';
  END IF;

  SELECT vs.lead_id
    INTO v_old_lead_id
  FROM public.visitor_sessions AS vs
  WHERE vs.id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'session_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM 1
  FROM public.conversations AS c
  WHERE c.id = p_current_conversation_id
    AND c.session_id = p_session_id
    AND c.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'active_conversation_not_found' USING ERRCODE = 'P0002';
  END IF;

  PERFORM 1
  FROM public.messages AS m
  WHERE m.id = p_visitor_message_id
    AND m.conversation_id = p_current_conversation_id
    AND m.message_type = 'visitor_text'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'visitor_message_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_old_lead_id IS NOT NULL THEN
    SELECT l.name, l.email
      INTO v_contact_name, v_contact_email
    FROM public.leads AS l
    WHERE l.id = v_old_lead_id;
  END IF;

  INSERT INTO public.leads (
    language,
    source,
    last_interaction_at,
    primary_service,
    service_variant,
    secondary_services,
    need_description,
    name,
    email
  ) VALUES (
    p_language,
    'website_agent',
    v_now,
    p_primary_service,
    CASE WHEN p_primary_service = 'websites' THEN p_service_variant ELSE NULL END,
    COALESCE(p_secondary_services, '[]'::JSONB),
    NULLIF(btrim(p_need_description), ''),
    v_contact_name,
    v_contact_email
  )
  RETURNING id INTO v_new_lead_id;

  UPDATE public.conversations
  SET status = 'completed',
      commercial_stage = 'closed',
      primary_outcome = CASE WHEN v_old_lead_id IS NULL THEN 'information_only' ELSE 'lead_captured' END,
      last_activity_at = v_now,
      closed_at = v_now
  WHERE id = p_current_conversation_id;

  INSERT INTO public.conversations (
    session_id,
    lead_id,
    status,
    commercial_stage,
    language,
    last_activity_at
  ) VALUES (
    p_session_id,
    v_new_lead_id,
    'active',
    'discovery',
    p_language,
    v_now
  )
  RETURNING id INTO v_new_conversation_id;

  UPDATE public.messages
  SET conversation_id = v_new_conversation_id,
      sequence_number = 1
  WHERE id = p_visitor_message_id;

  UPDATE public.visitor_sessions
  SET lead_id = v_new_lead_id,
      last_seen_at = LEAST(v_now, expires_at)
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'lead_id', v_new_lead_id,
    'conversation_id', v_new_conversation_id,
    'previous_lead_id', v_old_lead_id,
    'previous_conversation_id', p_current_conversation_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_separate_commercial_project(
  UUID, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB, TEXT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.start_separate_commercial_project(
  UUID, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB, TEXT
) TO service_role;

COMMENT ON FUNCTION public.start_separate_commercial_project(
  UUID, UUID, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB, TEXT
) IS 'Atomically closes the current project, creates a separate lead and conversation, moves the confirming visitor message, and updates the session pointer.';
