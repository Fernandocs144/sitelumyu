-- Migration: 20260910160000_harden_pipeline_transition_allowed_from.sql
-- Descrição: Hardening de TOCTOU da RPC transition_lead_pipeline_stage com validação atómica de p_allowed_from_stages dentro da transação.

DROP FUNCTION IF EXISTS public.transition_lead_pipeline_stage(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.transition_lead_pipeline_stage(UUID, TEXT, TEXT, UUID, TEXT[]);

CREATE OR REPLACE FUNCTION public.transition_lead_pipeline_stage(
  p_lead_id UUID,
  p_to_stage TEXT,
  p_source TEXT,
  p_changed_by UUID DEFAULT NULL,
  p_allowed_from_stages TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_stage TEXT;
  v_updated_lead JSONB;
  v_stage TEXT;
BEGIN
  -- 1. Validar etapa de destino (8 etapas permitidas)
  IF p_to_stage NOT IN (
    'new', 'qualified', 'meeting_scheduled', 'meeting_completed',
    'proposal', 'negotiation', 'won', 'lost'
  ) THEN
    RAISE EXCEPTION 'INVALID_PIPELINE_STAGE: %', p_to_stage;
  END IF;

  -- 2. Validar a origem (source permitidos: agent, calendar_webhook, admin_user, system)
  IF p_source NOT IN ('agent', 'calendar_webhook', 'admin_user', 'system') THEN
    RAISE EXCEPTION 'INVALID_PIPELINE_SOURCE: %', p_source;
  END IF;

  -- 3. Validar consistência de changed_by vs source
  IF p_source = 'admin_user' AND p_changed_by IS NULL THEN
    RAISE EXCEPTION 'CHANGED_BY_REQUIRED_FOR_ADMIN_USER';
  END IF;

  IF p_source <> 'admin_user' AND p_changed_by IS NOT NULL THEN
    RAISE EXCEPTION 'CHANGED_BY_MUST_BE_NULL_FOR_NON_ADMIN_USER';
  END IF;

  -- 4. Validar p_allowed_from_stages se fornecido
  IF p_allowed_from_stages IS NOT NULL THEN
    FOREACH v_stage IN ARRAY p_allowed_from_stages LOOP
      IF v_stage NOT IN (
        'new', 'qualified', 'meeting_scheduled', 'meeting_completed',
        'proposal', 'negotiation', 'won', 'lost'
      ) THEN
        RAISE EXCEPTION 'INVALID_ALLOWED_FROM_STAGE: %', v_stage;
      END IF;
    END LOOP;
  END IF;

  -- 5. Bloquear a linha do lead FOR UPDATE para evitar race conditions
  SELECT pipeline_stage INTO v_current_stage
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND: %', p_lead_id;
  END IF;

  -- 6. Verificar se é No-Op (from_stage === to_stage)
  IF v_current_stage = p_to_stage THEN
    SELECT jsonb_build_object(
      'id', l.id,
      'pipeline_stage', l.pipeline_stage,
      'updated_at', l.updated_at
    ) INTO v_updated_lead
    FROM public.leads l
    WHERE l.id = p_lead_id;

    RETURN jsonb_build_object(
      'ok', true,
      'changed', false,
      'status', 'noop',
      'from_stage', v_current_stage,
      'to_stage', p_to_stage,
      'lead', v_updated_lead
    );
  END IF;

  -- 7. Verificar se o estado atual pertence a p_allowed_from_stages (TOCTOU GUARD ATÓMICO)
  IF p_allowed_from_stages IS NOT NULL AND NOT (v_current_stage = ANY(p_allowed_from_stages)) THEN
    SELECT jsonb_build_object(
      'id', l.id,
      'pipeline_stage', l.pipeline_stage,
      'updated_at', l.updated_at
    ) INTO v_updated_lead
    FROM public.leads l
    WHERE l.id = p_lead_id;

    RETURN jsonb_build_object(
      'ok', true,
      'changed', false,
      'status', 'blocked_from_stage',
      'from_stage', v_current_stage,
      'to_stage', p_to_stage,
      'lead', v_updated_lead
    );
  END IF;

  -- 8. Transição atómica: Atualizar o lead (SEM alterar last_interaction_at)
  UPDATE public.leads
  SET pipeline_stage = p_to_stage
  WHERE id = p_lead_id;

  -- 9. Criar registo de histórico atómico
  INSERT INTO public.pipeline_stage_history (
    lead_id,
    from_stage,
    to_stage,
    source,
    changed_by,
    changed_at
  ) VALUES (
    p_lead_id,
    v_current_stage,
    p_to_stage,
    p_source,
    p_changed_by,
    clock_timestamp()
  );

  -- 10. Retornar payload formatado
  SELECT jsonb_build_object(
    'id', l.id,
    'pipeline_stage', l.pipeline_stage,
    'updated_at', l.updated_at
  ) INTO v_updated_lead
  FROM public.leads l
  WHERE l.id = p_lead_id;

  RETURN jsonb_build_object(
    'ok', true,
    'changed', true,
    'status', 'transitioned',
    'from_stage', v_current_stage,
    'to_stage', p_to_stage,
    'lead', v_updated_lead
  );
END;
$$;

-- Permissões restritas (Acesso exclusivo service_role)
REVOKE ALL ON FUNCTION public.transition_lead_pipeline_stage(UUID, TEXT, TEXT, UUID, TEXT[])
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.transition_lead_pipeline_stage(UUID, TEXT, TEXT, UUID, TEXT[])
  TO service_role;

COMMENT ON FUNCTION public.transition_lead_pipeline_stage(UUID, TEXT, TEXT, UUID, TEXT[]) IS
  'Função PL/pgSQL transacional atómica para alteração de pipeline_stage com locking FOR UPDATE, validação atómica de p_allowed_from_stages e registo em pipeline_stage_history (sem alterar last_interaction_at).';
