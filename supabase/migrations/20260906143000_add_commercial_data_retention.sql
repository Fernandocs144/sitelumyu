-- Enforce the approved commercial-agent retention policy once per day.
-- Anonymous messages: 30 days. Anonymous technical data: 90 days.
-- Prospective leads and associated conversations: 12 months after last interaction.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.run_commercial_data_retention(
  p_reference_time TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_anonymous_messages INTEGER := 0;
  v_request_events INTEGER := 0;
  v_message_attempts INTEGER := 0;
  v_abuse_attempts INTEGER := 0;
  v_security_attempts INTEGER := 0;
  v_anonymous_conversations INTEGER := 0;
  v_lead_conversations INTEGER := 0;
  v_leads INTEGER := 0;
  v_sessions INTEGER := 0;
  v_stale_lead_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF p_reference_time IS NULL THEN
    RAISE EXCEPTION 'p_reference_time must not be null';
  END IF;

  IF NOT pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtext('public.run_commercial_data_retention')
  ) THEN
    RETURN pg_catalog.jsonb_build_object('status', 'skipped_already_running');
  END IF;

  -- Remove message content earlier than technical metadata for anonymous visitors.
  DELETE FROM public.messages AS m
  USING public.conversations AS c
  WHERE m.conversation_id = c.id
    AND c.lead_id IS NULL
    AND m.created_at < p_reference_time - INTERVAL '30 days';
  GET DIAGNOSTICS v_anonymous_messages = ROW_COUNT;

  -- Technical counters and security metadata have a common 90-day lifetime.
  DELETE FROM public.commercial_request_events
  WHERE created_at < p_reference_time - INTERVAL '90 days';
  GET DIAGNOSTICS v_request_events = ROW_COUNT;

  DELETE FROM public.commercial_message_attempts
  WHERE created_at < p_reference_time - INTERVAL '90 days';
  GET DIAGNOSTICS v_message_attempts = ROW_COUNT;

  DELETE FROM public.commercial_abuse_attempts
  WHERE created_at < p_reference_time - INTERVAL '90 days';
  GET DIAGNOSTICS v_abuse_attempts = ROW_COUNT;

  DELETE FROM public.commercial_security_attempts
  WHERE created_at < p_reference_time - INTERVAL '90 days';
  GET DIAGNOSTICS v_security_attempts = ROW_COUNT;

  -- Deleting a conversation cascades to messages and remaining technical rows.
  DELETE FROM public.conversations AS c
  WHERE c.lead_id IS NULL
    AND COALESCE(c.last_activity_at, c.created_at)
      < p_reference_time - INTERVAL '90 days';
  GET DIAGNOSTICS v_anonymous_conversations = ROW_COUNT;

  -- Capture stale leads before deleting their conversations. Recent conversation
  -- activity protects a lead even if its own timestamp was not refreshed.
  SELECT COALESCE(array_agg(l.id), ARRAY[]::UUID[])
  INTO v_stale_lead_ids
  FROM public.leads AS l
  WHERE GREATEST(
    COALESCE(l.last_interaction_at, l.created_at),
    COALESCE(
      (
        SELECT MAX(COALESCE(c.last_activity_at, c.created_at))
        FROM public.conversations AS c
        WHERE c.lead_id = l.id
      ),
      l.created_at
    )
  ) < p_reference_time - INTERVAL '12 months';

  DELETE FROM public.conversations
  WHERE lead_id = ANY(v_stale_lead_ids);
  GET DIAGNOSTICS v_lead_conversations = ROW_COUNT;

  DELETE FROM public.leads
  WHERE id = ANY(v_stale_lead_ids);
  GET DIAGNOSTICS v_leads = ROW_COUNT;

  -- Sessions are removed last. Any linked conversation keeps its session until
  -- the applicable conversation retention period has elapsed.
  DELETE FROM public.visitor_sessions AS vs
  WHERE vs.lead_id IS NULL
    AND vs.expires_at < p_reference_time
    AND vs.created_at < p_reference_time - INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1
      FROM public.conversations AS c
      WHERE c.session_id = vs.id
    );
  GET DIAGNOSTICS v_sessions = ROW_COUNT;

  RETURN pg_catalog.jsonb_build_object(
    'status', 'completed',
    'anonymous_messages_deleted', v_anonymous_messages,
    'request_events_deleted', v_request_events,
    'message_attempts_deleted', v_message_attempts,
    'abuse_attempts_deleted', v_abuse_attempts,
    'security_attempts_deleted', v_security_attempts,
    'anonymous_conversations_deleted', v_anonymous_conversations,
    'lead_conversations_deleted', v_lead_conversations,
    'leads_deleted', v_leads,
    'sessions_deleted', v_sessions,
    'reference_time', p_reference_time
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_commercial_data_retention(TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_commercial_data_retention(TIMESTAMPTZ)
  TO service_role;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'commercial-data-retention-daily';

SELECT cron.schedule(
  'commercial-data-retention-daily',
  '17 3 * * *',
  'SELECT public.run_commercial_data_retention();'
);

COMMENT ON FUNCTION public.run_commercial_data_retention(TIMESTAMPTZ) IS
  'Deletes commercial-agent data according to the approved 30-day, 90-day and 12-month retention periods. Runs daily through pg_cron.';
