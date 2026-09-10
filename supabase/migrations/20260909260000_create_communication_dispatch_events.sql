-- Migration: 20260909260000_create_communication_dispatch_events.sql
-- Descrição: Tabela public.communication_dispatch_events e campos de auditoria de webhooks para a Fase 7I.1

-- 1. Garantir que communication_dispatches aceita providers adicionais (ex: 'resend') e possui colunas de evento
ALTER TABLE public.communication_dispatches
  ADD COLUMN IF NOT EXISTS last_event_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ NULL;

-- 2. Criar a tabela public.communication_dispatch_events para registo factual de webhooks da Resend
CREATE TABLE IF NOT EXISTS public.communication_dispatch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NULL REFERENCES public.communication_dispatches(id) ON DELETE SET NULL,
  provider_message_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_communication_dispatch_events_provider_msg
  ON public.communication_dispatch_events (provider_message_id);

CREATE INDEX IF NOT EXISTS idx_communication_dispatch_events_dispatch_id
  ON public.communication_dispatch_events (dispatch_id);

-- 4. RLS Hardening (Bloqueio total anon/authenticated, permissão apenas service_role)
ALTER TABLE public.communication_dispatch_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anon access to communication_dispatch_events" ON public.communication_dispatch_events;
CREATE POLICY "No anon access to communication_dispatch_events"
  ON public.communication_dispatch_events FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "No authenticated direct access to communication_dispatch_events" ON public.communication_dispatch_events;
CREATE POLICY "No authenticated direct access to communication_dispatch_events"
  ON public.communication_dispatch_events FOR ALL TO authenticated USING (false);

GRANT SELECT, INSERT, UPDATE ON public.communication_dispatch_events TO service_role;
