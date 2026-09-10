-- Migration: 20260909193000_add_pipeline_initial_history_rpc_and_index.sql
-- Descrição: Adição de índice único parcial para idempotência do histórico inicial do pipeline e RPC initialize_lead_pipeline_history (Fase 3B)

-- 1. Criar índice único parcial para garantir que cada lead tem no máximo UM registo inicial (from_stage IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pipeline_stage_history_unique_initial
  ON public.pipeline_stage_history (lead_id)
  WHERE (from_stage IS NULL);

-- 2. Criar a RPC initialize_lead_pipeline_history para inserção atómica e idempotente do histórico inicial de novas leads
CREATE OR REPLACE FUNCTION public.initialize_lead_pipeline_history(
  p_lead_id UUID,
  p_source TEXT DEFAULT 'agent'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_stage TEXT;
BEGIN
  -- 1. Validar a existência e bloquear a linha do lead (FOR UPDATE)
  SELECT pipeline_stage INTO v_current_stage
  FROM public.leads
  WHERE id = p_lead_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'LEAD_NOT_FOUND';
  END IF;

  -- 2. Inserir o registo inicial se não existir nenhum registo com from_stage IS NULL
  INSERT INTO public.pipeline_stage_history (
    lead_id,
    from_stage,
    to_stage,
    source,
    changed_by,
    changed_at
  )
  SELECT
    p_lead_id,
    NULL,
    v_current_stage,
    p_source,
    NULL,
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.pipeline_stage_history
    WHERE lead_id = p_lead_id AND from_stage IS NULL
  );

  RETURN TRUE;
END;
$$;

-- 3. Hardening de permissões da RPC (acesso exclusivo para service_role)
REVOKE ALL ON FUNCTION public.initialize_lead_pipeline_history(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initialize_lead_pipeline_history(UUID, TEXT) TO service_role;

COMMENT ON FUNCTION public.initialize_lead_pipeline_history(UUID, TEXT) IS
  'Inicializa o registo inicial do histórico de pipeline (from_stage IS NULL) para novas leads de forma atómica e idempotente. Acesso exclusivo server-side (service_role).';
