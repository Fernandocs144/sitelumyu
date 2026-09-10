-- Migration: 20260909240000_create_communication_dispatches.sql
-- Descrição: Tabela public.communication_dispatches e adição de cadence_instance_id a approved_communications para a Fase 7F.1 / 7F.1.1

-- 1. Adicionar cadence_instance_id a public.approved_communications (nullable, com FK para pipeline_stage_history.id)
ALTER TABLE public.approved_communications
  ADD COLUMN IF NOT EXISTS cadence_instance_id UUID NULL REFERENCES public.pipeline_stage_history(id) ON DELETE RESTRICT;

-- 2. Criar a tabela public.communication_dispatches para registo factual de disparos técnicos
CREATE TABLE IF NOT EXISTS public.communication_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approved_communication_id UUID NOT NULL REFERENCES public.approved_communications(id) ON DELETE RESTRICT,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider = 'fake'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'accepted', 'failed', 'unknown')),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider_message_id TEXT NULL,
  recipient_email_snapshot TEXT NOT NULL CHECK (length(trim(recipient_email_snapshot)) > 0),
  subject_snapshot TEXT NULL,
  body_snapshot TEXT NOT NULL CHECK (length(trim(body_snapshot)) > 0),
  provider_accepted_at TIMESTAMPTZ NULL,
  error_code TEXT NULL,
  error_message TEXT NULL,
  dispatched_by UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Consistência semântica de status
  CONSTRAINT chk_dispatch_status_consistency CHECK (
    (status = 'accepted' AND provider_accepted_at IS NOT NULL AND provider_message_id IS NOT NULL) OR
    (status IN ('pending', 'processing', 'failed', 'unknown') AND provider_accepted_at IS NULL)
  )
);

-- 3. Índices de performance e unicidade parcial
CREATE UNIQUE INDEX IF NOT EXISTS idx_communication_dispatches_unique_provider_msg
  ON public.communication_dispatches (provider, provider_message_id)
  WHERE (provider_message_id IS NOT NULL AND status = 'accepted');

CREATE INDEX IF NOT EXISTS idx_communication_dispatches_lead_accepted
  ON public.communication_dispatches (lead_id, provider_accepted_at)
  WHERE (status = 'accepted');

CREATE INDEX IF NOT EXISTS idx_communication_dispatches_approved_comm
  ON public.communication_dispatches (approved_communication_id);

-- 4. RLS Hardening (Bloqueio total anon/authenticated, permissão apenas service_role)
ALTER TABLE public.communication_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anon access to communication_dispatches" ON public.communication_dispatches;
CREATE POLICY "No anon access to communication_dispatches"
  ON public.communication_dispatches FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "No authenticated direct access to communication_dispatches" ON public.communication_dispatches;
CREATE POLICY "No authenticated direct access to communication_dispatches"
  ON public.communication_dispatches FOR ALL TO authenticated USING (false);

GRANT SELECT, INSERT, UPDATE ON public.communication_dispatches TO service_role;
