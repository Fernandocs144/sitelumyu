-- Migration: 20260909230000_create_approved_communications.sql
-- Descrição: Criação da tabela public.approved_communications para aprovação humana formal de conteúdos comerciais (Fase 7D.1)

CREATE TABLE IF NOT EXISTS public.approved_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  context_fingerprint VARCHAR(64) NOT NULL,
  reason_code TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NULL,
  subject TEXT NULL,
  body TEXT NOT NULL,
  generation_source TEXT NOT NULL,
  prompt_version TEXT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  approved_by UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_by UUID NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  cancelled_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_approved_comm_status CHECK (status IN ('approved', 'cancelled')),
  CONSTRAINT chk_approved_comm_channel CHECK (channel IN ('email')),
  CONSTRAINT chk_approved_comm_source CHECK (generation_source IN ('ai', 'fallback', 'manual')),
  CONSTRAINT chk_approved_comm_status_consistency CHECK (
    (status = 'approved' AND cancelled_by IS NULL AND cancelled_at IS NULL) OR
    (status = 'cancelled' AND cancelled_by IS NOT NULL AND cancelled_at IS NOT NULL)
  ),
  CONSTRAINT chk_approved_comm_body_not_empty CHECK (length(trim(both E'\r\n\t ' from body)) > 0),
  CONSTRAINT chk_approved_comm_body_length CHECK (length(body) <= 10000),
  CONSTRAINT chk_approved_comm_subject_length CHECK (subject IS NULL OR length(subject) <= 255),
  CONSTRAINT chk_approved_comm_recipient_name_length CHECK (recipient_name IS NULL OR length(recipient_name) <= 200)
);

-- Unique Partial Index para garantir no máximo UMA aprovação ativa por (lead_id, context_fingerprint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_approved_comm_active_unique
  ON public.approved_communications (lead_id, context_fingerprint)
  WHERE status = 'approved';

-- Índice para pesquisas por lead e ordenação cronológica
CREATE INDEX IF NOT EXISTS idx_approved_comm_lead_lookup
  ON public.approved_communications (lead_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.approved_communications ENABLE ROW LEVEL SECURITY;

-- Bloqueio de acesso direto via cliente Supabase (anon e authenticated)
DROP POLICY IF EXISTS "No direct access for anon" ON public.approved_communications;
CREATE POLICY "No direct access for anon" ON public.approved_communications
  FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "No direct access for authenticated" ON public.approved_communications;
CREATE POLICY "No direct access for authenticated" ON public.approved_communications
  FOR ALL TO authenticated USING (false);

-- Conceder privilégios exclusivamente a service_role
GRANT SELECT, INSERT, UPDATE ON public.approved_communications TO service_role;

COMMENT ON TABLE public.approved_communications IS
  'Registo formal e imutável de comunicações comerciais aprovadas por um Admin. Acesso exclusivo server-side.';
