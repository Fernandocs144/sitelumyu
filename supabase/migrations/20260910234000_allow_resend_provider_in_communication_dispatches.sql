-- Migration: 20260910234000_allow_resend_provider_in_communication_dispatches.sql
-- Descrição: Permitir provider 'resend' e 'fake' em public.communication_dispatches

ALTER TABLE public.communication_dispatches
  DROP CONSTRAINT IF EXISTS communication_dispatches_provider_check;

ALTER TABLE public.communication_dispatches
  ADD CONSTRAINT communication_dispatches_provider_check
  CHECK (provider IN ('resend', 'fake'));
