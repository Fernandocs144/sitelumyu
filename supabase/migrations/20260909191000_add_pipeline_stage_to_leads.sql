-- Migration: 20260909191000_add_pipeline_stage_to_leads.sql
-- Descrição: Adição do campo pipeline_stage a public.leads e criação da tabela public.pipeline_stage_history para a Fundação do CRM LUMYO (Fase 1)

-- 1. Adicionar a coluna pipeline_stage a public.leads com default 'new'
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'new';

-- 2. Adicionar a CHECK constraint para os 8 estados permitidos do funil comercial
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_leads_pipeline_stage'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT chk_leads_pipeline_stage
      CHECK (
        pipeline_stage IN (
          'new',
          'qualified',
          'meeting_scheduled',
          'meeting_completed',
          'proposal',
          'negotiation',
          'won',
          'lost'
        )
      );
  END IF;
END $$;

-- 3. Criar a tabela public.pipeline_stage_history para auditoria e histórico de transições
CREATE TABLE IF NOT EXISTS public.pipeline_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_stage TEXT NULL,
  to_stage TEXT NOT NULL,
  source TEXT NOT NULL,
  changed_by UUID NULL REFERENCES public.admin_users(user_id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_pipeline_history_from_stage
    CHECK (
      from_stage IS NULL
      OR from_stage IN (
        'new',
        'qualified',
        'meeting_scheduled',
        'meeting_completed',
        'proposal',
        'negotiation',
        'won',
        'lost'
      )
    ),

  CONSTRAINT chk_pipeline_history_to_stage
    CHECK (
      to_stage IN (
        'new',
        'qualified',
        'meeting_scheduled',
        'meeting_completed',
        'proposal',
        'negotiation',
        'won',
        'lost'
      )
    ),

  CONSTRAINT chk_pipeline_history_source
    CHECK (
      source IN ('agent', 'calendar_webhook', 'admin_user', 'system')
    )
);

-- 4. Backfill determinístico das leads existentes
-- PRIORIDADE 1: Se existir calendar_booking associado ao lead com status IN ('confirmed', 'rescheduled') -> 'meeting_scheduled'
-- PRIORIDADE 2: Caso contrário, se lead_classification IN ('priority', 'qualified') -> 'qualified'
-- PRIORIDADE 3: Todos os restantes -> 'new'
UPDATE public.leads AS l
SET pipeline_stage = CASE
  WHEN EXISTS (
    SELECT 1 FROM public.calendar_bookings cb
    WHERE cb.lead_id = l.id
      AND cb.status IN ('confirmed', 'rescheduled')
  ) THEN 'meeting_scheduled'
  WHEN l.lead_classification IN ('priority', 'qualified') THEN 'qualified'
  ELSE 'new'
END;

-- 5. Histórico inicial para os leads existentes (idempotente)
-- NOTA SEMÂNTICA (FASE 1.1): changed_at utiliza now() para refletir o momento exato em que a lead deu entrada no funil CRM (momento do backfill), e NÃO lead.created_at.
INSERT INTO public.pipeline_stage_history (
  lead_id,
  from_stage,
  to_stage,
  source,
  changed_by,
  changed_at
)
SELECT
  l.id,
  NULL,
  l.pipeline_stage,
  'system',
  NULL,
  now()
FROM public.leads l
WHERE NOT EXISTS (
  SELECT 1 FROM public.pipeline_stage_history h
  WHERE h.lead_id = l.id AND h.source = 'system'
);

-- 6. Índices de performance
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage
  ON public.leads (pipeline_stage);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_lead_changed
  ON public.pipeline_stage_history (lead_id, changed_at DESC);

-- 7. Ativação de RLS e Permissões de pipeline_stage_history
ALTER TABLE public.pipeline_stage_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pipeline_stage_history
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.pipeline_stage_history
  TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Deny direct client access to pipeline_stage_history'
  ) THEN
    CREATE POLICY "Deny direct client access to pipeline_stage_history"
      ON public.pipeline_stage_history
      FOR ALL
      TO public
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- 8. Documentação dos novos campos e tabelas
COMMENT ON COLUMN public.leads.pipeline_stage IS
  'Estado atual da oportunidade no funil comercial CRM (new, qualified, meeting_scheduled, meeting_completed, proposal, negotiation, won, lost).';

COMMENT ON TABLE public.pipeline_stage_history IS
  'Histórico de alterações de etapa do funil comercial para auditoria e cálculo de métricas de conversão. Acesso exclusivo server-side.';
