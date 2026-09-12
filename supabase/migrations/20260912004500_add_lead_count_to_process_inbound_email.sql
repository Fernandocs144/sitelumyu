-- Migration: 20260912004500_add_lead_count_to_process_inbound_email.sql
-- Descrição: Atualiza public.process_inbound_email para devolver a propriedade lead_count no payload JSON.

CREATE OR REPLACE FUNCTION public.process_inbound_email(
  p_provider VARCHAR(30),
  p_provider_message_id VARCHAR(255),
  p_sender_email VARCHAR(200),
  p_recipient_email VARCHAR(200),
  p_subject TEXT DEFAULT NULL,
  p_text_content TEXT DEFAULT NULL,
  p_html_content TEXT DEFAULT NULL,
  p_received_at TIMESTAMPTZ DEFAULT clock_timestamp()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_normalized_sender VARCHAR(200);
  v_lead_id UUID := NULL;
  v_inbound_id UUID := NULL;
  v_inserted BOOLEAN := FALSE;
  v_updated_last_interaction BOOLEAN := FALSE;
  v_existing_last_interaction TIMESTAMPTZ := NULL;
  v_lead_count INT := 0;
BEGIN
  IF p_provider IS NULL OR trim(p_provider) = '' THEN
    RAISE EXCEPTION 'p_provider é obrigatório em process_inbound_email';
  END IF;
  IF p_provider_message_id IS NULL OR trim(p_provider_message_id) = '' THEN
    RAISE EXCEPTION 'p_provider_message_id é obrigatório em process_inbound_email';
  END IF;
  IF p_sender_email IS NULL OR trim(p_sender_email) = '' THEN
    RAISE EXCEPTION 'p_sender_email é obrigatório em process_inbound_email';
  END IF;
  IF p_recipient_email IS NULL OR trim(p_recipient_email) = '' THEN
    RAISE EXCEPTION 'p_recipient_email é obrigatório em process_inbound_email';
  END IF;
  IF p_received_at IS NULL THEN
    p_received_at := clock_timestamp();
  END IF;

  v_normalized_sender := lower(trim(p_sender_email));

  -- 1. Contar leads com email_normalized correspondente (apenas associa se existir EXATAMENTE 1 lead)
  SELECT count(*) INTO v_lead_count
  FROM public.leads
  WHERE email_normalized = v_normalized_sender;

  IF v_lead_count = 1 THEN
    SELECT id, last_interaction_at
    INTO v_lead_id, v_existing_last_interaction
    FROM public.leads
    WHERE email_normalized = v_normalized_sender;
  ELSE
    v_lead_id := NULL;
    v_existing_last_interaction := NULL;
  END IF;

  -- 2. Tentar inserir a comunicação de forma idempotente
  INSERT INTO public.inbound_communications (
    provider,
    provider_message_id,
    channel,
    lead_id,
    sender_email,
    recipient_email,
    subject,
    text_content,
    html_content,
    received_at
  )
  VALUES (
    p_provider,
    p_provider_message_id,
    'email',
    v_lead_id,
    p_sender_email,
    p_recipient_email,
    p_subject,
    p_text_content,
    p_html_content,
    p_received_at
  )
  ON CONFLICT (provider, provider_message_id) DO NOTHING
  RETURNING id INTO v_inbound_id;

  IF v_inbound_id IS NOT NULL THEN
    v_inserted := TRUE;
  ELSE
    -- Já existia previamente este provider_message_id
    SELECT id, lead_id INTO v_inbound_id, v_lead_id
    FROM public.inbound_communications
    WHERE provider = p_provider AND provider_message_id = p_provider_message_id;
    
    RETURN jsonb_build_object(
      'inserted', FALSE,
      'inbound_id', v_inbound_id,
      'lead_id', v_lead_id,
      'updated_last_interaction', FALSE,
      'lead_count', v_lead_count
    );
  END IF;

  -- 3. Se associado a uma lead e v_inserted for TRUE, atualizar last_interaction_at se p_received_at for superior
  IF v_lead_id IS NOT NULL THEN
    IF v_existing_last_interaction IS NULL OR p_received_at > v_existing_last_interaction THEN
      UPDATE public.leads
      SET last_interaction_at = p_received_at,
          updated_at = clock_timestamp()
      WHERE id = v_lead_id;

      v_updated_last_interaction := TRUE;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'inserted', TRUE,
    'inbound_id', v_inbound_id,
    'lead_id', v_lead_id,
    'updated_last_interaction', v_updated_last_interaction,
    'lead_count', v_lead_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.process_inbound_email(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_inbound_email(VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;

COMMENT ON FUNCTION public.process_inbound_email IS 'Processa de forma atómica e idempotente um email recebido, devolvendo lead_count e atualizando last_interaction_at se 1 lead.';
