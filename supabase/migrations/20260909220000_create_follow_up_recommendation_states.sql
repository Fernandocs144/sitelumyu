-- Migration: 20260909220000_create_follow_up_recommendation_states.sql
-- Descrição: Criação da tabela public.follow_up_recommendation_states para registo append-only de ações humanas de follow-up (Ignorar, Adiar, Restaurar)

CREATE TABLE IF NOT EXISTS public.follow_up_recommendation_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  reason_code TEXT NOT NULL,
  context_fingerprint VARCHAR(64) NOT NULL,
  action TEXT NOT NULL,
  snoozed_until TIMESTAMPTZ NULL,
  note TEXT NULL,
  created_by UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_follow_up_rec_states_action CHECK (action IN ('ignored', 'snoozed', 'restored')),
  CONSTRAINT chk_follow_up_rec_states_snooze_consistency CHECK (
    (action = 'snoozed' AND snoozed_until IS NOT NULL) OR
    (action IN ('ignored', 'restored') AND snoozed_until IS NULL)
  ),
  CONSTRAINT chk_follow_up_rec_states_note_length CHECK (note IS NULL OR length(note) <= 1000)
);

-- Índice para pesquisa cronológica de histórico por lead e fingerprint
CREATE INDEX IF NOT EXISTS idx_follow_up_rec_states_lookup
  ON public.follow_up_recommendation_states (lead_id, context_fingerprint, created_at DESC, id DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.follow_up_recommendation_states ENABLE ROW LEVEL SECURITY;

-- Bloqueio de acesso direto via cliente Supabase (anon e authenticated)
-- Operações executadas exclusivamente server-side via service_role client.
DROP POLICY IF EXISTS "No direct access for anon" ON public.follow_up_recommendation_states;
CREATE POLICY "No direct access for anon" ON public.follow_up_recommendation_states
  FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "No direct access for authenticated" ON public.follow_up_recommendation_states;
CREATE POLICY "No direct access for authenticated" ON public.follow_up_recommendation_states
  FOR ALL TO authenticated USING (false);

-- Conceder privilégios exclusivamente a service_role
GRANT SELECT, INSERT ON public.follow_up_recommendation_states TO service_role;

COMMENT ON TABLE public.follow_up_recommendation_states IS
  'Registo append-only imutável de decisões humanas sobre recomendações de follow-up. Acesso exclusivo server-side.';
