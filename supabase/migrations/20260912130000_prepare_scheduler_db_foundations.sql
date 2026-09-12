-- Migration: 20260912130000_prepare_scheduler_db_foundations.sql
-- Descrição: Fundações de base de dados para o scheduler automático de acompanhamento comercial (Fase 8).

-- 1. Tabela approved_communications: Suporte para aprovação auditável (manual vs automatic)
ALTER TABLE public.approved_communications
  ADD COLUMN IF NOT EXISTS approval_mode TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.approved_communications
  DROP CONSTRAINT IF EXISTS chk_approved_comm_approval_mode;
ALTER TABLE public.approved_communications
  ADD CONSTRAINT chk_approved_comm_approval_mode
  CHECK (approval_mode IN ('manual', 'automatic'));

ALTER TABLE public.approved_communications
  ALTER COLUMN approved_by DROP NOT NULL;

ALTER TABLE public.approved_communications
  DROP CONSTRAINT IF EXISTS chk_approved_comm_approval_consistency;
ALTER TABLE public.approved_communications
  ADD CONSTRAINT chk_approved_comm_approval_consistency CHECK (
    (approval_mode = 'manual' AND approved_by IS NOT NULL) OR
    (approval_mode = 'automatic' AND approved_by IS NULL)
  );

COMMENT ON COLUMN public.approved_communications.approval_mode IS
  'Origem formal da autorização de envio: manual (Admin humano) ou automatic (Scheduler).';


-- 2. Tabela lead_tasks: Suporte para tarefas automáticas idempotentes
ALTER TABLE public.lead_tasks
  ADD COLUMN IF NOT EXISTS creation_mode TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS reason_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS context_fingerprint VARCHAR(64) NULL;

ALTER TABLE public.lead_tasks
  DROP CONSTRAINT IF EXISTS chk_lead_tasks_creation_mode;
ALTER TABLE public.lead_tasks
  ADD CONSTRAINT chk_lead_tasks_creation_mode
  CHECK (creation_mode IN ('manual', 'automatic'));

ALTER TABLE public.lead_tasks
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.lead_tasks
  DROP CONSTRAINT IF EXISTS chk_lead_tasks_creation_consistency;
ALTER TABLE public.lead_tasks
  ADD CONSTRAINT chk_lead_tasks_creation_consistency CHECK (
    (creation_mode = 'manual' AND created_by IS NOT NULL) OR
    (creation_mode = 'automatic' AND created_by IS NULL)
  );

-- Índice único parcial para tarefas automáticas (impede tarefas duplicadas para o mesmo motivo e fingerprint factual)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_tasks_auto_unique
  ON public.lead_tasks (lead_id, reason_code, context_fingerprint)
  WHERE creation_mode = 'automatic';

COMMENT ON COLUMN public.lead_tasks.creation_mode IS
  'Origem da criação da tarefa: manual (Admin) ou automatic (Engine/Scheduler).';
COMMENT ON COLUMN public.lead_tasks.reason_code IS
  'Motivo do motor de acompanhamento para a tarefa automática.';
COMMENT ON COLUMN public.lead_tasks.context_fingerprint IS
  'Fingerprint factual do contexto da lead no momento da criação automática da tarefa.';


-- 3. RPC public.create_automatic_lead_task
CREATE OR REPLACE FUNCTION public.create_automatic_lead_task(
  p_lead_id UUID,
  p_assigned_to UUID,
  p_title TEXT,
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_reason_code TEXT DEFAULT NULL,
  p_context_fingerprint VARCHAR(64) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_task_id UUID := NULL;
BEGIN
  IF p_lead_id IS NULL THEN
    RAISE EXCEPTION 'p_lead_id é obrigatório em create_automatic_lead_task';
  END IF;
  IF p_assigned_to IS NULL THEN
    RAISE EXCEPTION 'p_assigned_to é obrigatório em create_automatic_lead_task';
  END IF;
  IF p_title IS NULL OR trim(p_title) = '' THEN
    RAISE EXCEPTION 'p_title é obrigatório em create_automatic_lead_task';
  END IF;
  IF p_reason_code IS NULL OR trim(p_reason_code) = '' THEN
    RAISE EXCEPTION 'p_reason_code é obrigatório para tarefas automáticas em create_automatic_lead_task';
  END IF;
  IF p_context_fingerprint IS NULL OR trim(p_context_fingerprint) = '' THEN
    RAISE EXCEPTION 'p_context_fingerprint é obrigatório para tarefas automáticas em create_automatic_lead_task';
  END IF;

  INSERT INTO public.lead_tasks (
    lead_id,
    title,
    status,
    priority,
    due_at,
    assigned_to,
    created_by,
    creation_mode,
    reason_code,
    context_fingerprint,
    created_at
  )
  VALUES (
    p_lead_id,
    trim(p_title),
    'open',
    COALESCE(p_priority, 'normal'),
    p_due_at,
    p_assigned_to,
    NULL,
    'automatic',
    trim(p_reason_code),
    trim(p_context_fingerprint),
    clock_timestamp()
  )
  ON CONFLICT (lead_id, reason_code, context_fingerprint) WHERE creation_mode = 'automatic' DO NOTHING
  RETURNING id INTO v_task_id;

  IF v_task_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'inserted', TRUE,
      'task_id', v_task_id
    );
  ELSE
    SELECT id INTO v_task_id
    FROM public.lead_tasks
    WHERE lead_id = p_lead_id
      AND reason_code = trim(p_reason_code)
      AND context_fingerprint = trim(p_context_fingerprint)
      AND creation_mode = 'automatic';

    RETURN jsonb_build_object(
      'inserted', FALSE,
      'task_id', v_task_id
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.create_automatic_lead_task(UUID, UUID, TEXT, VARCHAR, TIMESTAMPTZ, TEXT, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_automatic_lead_task(UUID, UUID, TEXT, VARCHAR, TIMESTAMPTZ, TEXT, VARCHAR) TO service_role;

COMMENT ON FUNCTION public.create_automatic_lead_task IS
  'Cria uma tarefa automática idempotente de forma atómica para um motivo e contexto de lead.';


-- 4. Tabela e RPCs para Scheduler Job Locks (Lease Persistente)
CREATE TABLE IF NOT EXISTS public.scheduler_job_locks (
  job_name VARCHAR(100) PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL,
  locked_by VARCHAR(100) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE public.scheduler_job_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access for anon" ON public.scheduler_job_locks;
CREATE POLICY "No direct access for anon" ON public.scheduler_job_locks
  FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "No direct access for authenticated" ON public.scheduler_job_locks;
CREATE POLICY "No direct access for authenticated" ON public.scheduler_job_locks
  FOR ALL TO authenticated USING (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduler_job_locks TO service_role;

COMMENT ON TABLE public.scheduler_job_locks IS
  'Registo persistente de locks/leases com expiração automática para jobs agendados serverless.';


-- 4.1 RPC try_acquire_scheduler_lock
CREATE OR REPLACE FUNCTION public.try_acquire_scheduler_lock(
  p_job_name VARCHAR(100),
  p_owner_id VARCHAR(100),
  p_lease_seconds INT DEFAULT 300
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_new_until TIMESTAMPTZ;
  v_existing RECORD;
  v_effective_lease_seconds INT;
BEGIN
  IF p_job_name IS NULL OR trim(p_job_name) = '' THEN
    RAISE EXCEPTION 'p_job_name é obrigatório em try_acquire_scheduler_lock';
  END IF;
  IF p_owner_id IS NULL OR trim(p_owner_id) = '' THEN
    RAISE EXCEPTION 'p_owner_id é obrigatório em try_acquire_scheduler_lock';
  END IF;

  v_effective_lease_seconds := GREATEST(COALESCE(p_lease_seconds, 300), 1);
  v_new_until := v_now + (v_effective_lease_seconds || ' seconds')::interval;

  -- Advisory lock no PostgreSQL para serializar atomicamente a aquisição/renovação durante a instrução
  PERFORM pg_catalog.pg_advisory_xact_lock(hashtext('scheduler_lock_' || p_job_name));

  SELECT * INTO v_existing
  FROM public.scheduler_job_locks
  WHERE job_name = trim(p_job_name);

  IF v_existing.job_name IS NULL THEN
    INSERT INTO public.scheduler_job_locks (job_name, locked_until, locked_by, updated_at)
    VALUES (trim(p_job_name), v_new_until, trim(p_owner_id), v_now);

    RETURN jsonb_build_object(
      'acquired', TRUE,
      'locked_until', v_new_until,
      'locked_by', trim(p_owner_id)
    );
  ELSIF v_existing.locked_until < v_now OR v_existing.locked_by = trim(p_owner_id) THEN
    UPDATE public.scheduler_job_locks
    SET locked_until = v_new_until,
        locked_by = trim(p_owner_id),
        updated_at = v_now
    WHERE job_name = trim(p_job_name);

    RETURN jsonb_build_object(
      'acquired', TRUE,
      'locked_until', v_new_until,
      'locked_by', trim(p_owner_id)
    );
  ELSE
    RETURN jsonb_build_object(
      'acquired', FALSE,
      'locked_until', v_existing.locked_until,
      'locked_by', v_existing.locked_by
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.try_acquire_scheduler_lock(VARCHAR, VARCHAR, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_acquire_scheduler_lock(VARCHAR, VARCHAR, INT) TO service_role;

COMMENT ON FUNCTION public.try_acquire_scheduler_lock IS
  'Tenta adquirir ou renovar um lock persistente com tempo de lease expirável para um job agendado.';


-- 4.2 RPC release_scheduler_lock
CREATE OR REPLACE FUNCTION public.release_scheduler_lock(
  p_job_name VARCHAR(100),
  p_owner_id VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  IF p_job_name IS NULL OR trim(p_job_name) = '' OR p_owner_id IS NULL OR trim(p_owner_id) = '' THEN
    RETURN jsonb_build_object('released', FALSE);
  END IF;

  DELETE FROM public.scheduler_job_locks
  WHERE job_name = trim(p_job_name) AND locked_by = trim(p_owner_id);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'released',
    v_deleted_count > 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.release_scheduler_lock(VARCHAR, VARCHAR) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_scheduler_lock(VARCHAR, VARCHAR) TO service_role;

COMMENT ON FUNCTION public.release_scheduler_lock IS
  'Liberta um lock persistente de job agendado se pertencente ao mesmo owner.';
