-- Migration: Update RPC Function for Atomic Communication Dispatch Event Advancement & Status Mapping
-- Date: 2026-09-12
-- Phase: Final Lifecycle Fix

CREATE OR REPLACE FUNCTION public.advance_communication_dispatch_event(
  p_dispatch_id UUID,
  p_event_type TEXT,
  p_provider_event_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_updated_rows INT;
  v_new_status TEXT;
BEGIN
  IF p_dispatch_id IS NULL OR p_event_type IS NULL OR p_provider_event_at IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Mapeamento estrito de eventos Resend suportados para o status do dispatch
  CASE p_event_type
    WHEN 'email.delivered' THEN v_new_status := 'delivered';
    WHEN 'email.delivery_delayed' THEN v_new_status := 'delayed';
    WHEN 'email.bounced' THEN v_new_status := 'bounced';
    WHEN 'email.complained' THEN v_new_status := 'complained';
    WHEN 'email.failed' THEN v_new_status := 'failed';
    ELSE v_new_status := NULL;
  END CASE;

  UPDATE public.communication_dispatches
  SET
    status = COALESCE(v_new_status, status),
    last_event_type = p_event_type,
    last_event_at = p_provider_event_at,
    updated_at = now()
  WHERE
    id = p_dispatch_id
    AND (
      last_event_at IS NULL
      OR last_event_at < p_provider_event_at
    );

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RETURN v_updated_rows > 0;
END;
$$;

-- Security hardening for RPC permissions
REVOKE EXECUTE ON FUNCTION public.advance_communication_dispatch_event(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.advance_communication_dispatch_event(UUID, TEXT, TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.advance_communication_dispatch_event(UUID, TEXT, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.advance_communication_dispatch_event(UUID, TEXT, TIMESTAMPTZ) TO service_role;
