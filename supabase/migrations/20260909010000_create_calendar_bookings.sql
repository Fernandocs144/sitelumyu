-- Migration: 20260909010000_create_calendar_bookings.sql
-- Tabela para persistência real de agendamentos do Cal.com

CREATE TABLE IF NOT EXISTS public.calendar_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'calcom',
    external_booking_id TEXT NOT NULL,
    conversation_id UUID NULL REFERENCES public.conversations(id) ON DELETE SET NULL,
    lead_id UUID NULL REFERENCES public.leads(id) ON DELETE SET NULL,
    status VARCHAR(35) NOT NULL,
    start_time TIMESTAMPTZ NULL,
    end_time TIMESTAMPTZ NULL,
    timezone TEXT NULL,
    attendee_name TEXT NULL,
    attendee_email TEXT NULL,
    provider_metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unq_calendar_bookings_provider_external UNIQUE (provider, external_booking_id),
    CONSTRAINT chk_calendar_bookings_status CHECK (status IN ('confirmed', 'rescheduled', 'cancelled', 'pending'))
);

-- Ativar RLS
ALTER TABLE public.calendar_bookings ENABLE ROW LEVEL SECURITY;

-- Bloquear acesso direto por clientes anon/authenticated (acesso exclusivo server-side via service_role)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Deny direct client access to calendar_bookings'
    ) THEN
        CREATE POLICY "Deny direct client access to calendar_bookings"
            ON public.calendar_bookings
            FOR ALL
            TO public
            USING (false)
            WITH CHECK (false);
    END IF;
END $$;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_conversation ON public.calendar_bookings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_lead ON public.calendar_bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_status ON public.calendar_bookings(status);
