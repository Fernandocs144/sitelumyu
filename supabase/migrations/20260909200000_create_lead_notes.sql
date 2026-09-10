-- Migration: Create lead_notes table with constraints, index, and RLS
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_lead_notes_content_not_empty CHECK (length(trim(both E'\r\n\t ' from content)) > 0),
  CONSTRAINT chk_lead_notes_content_max_length CHECK (length(content) <= 5000)
);

-- Index for efficient chronological retrieval by lead
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id_created_at
  ON public.lead_notes (lead_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Block direct client access (anon and authenticated)
-- Admin operations are executed exclusively server-side via service_role client.
CREATE POLICY "No direct access for anon" ON public.lead_notes
  FOR ALL TO anon USING (false);

CREATE POLICY "No direct access for authenticated" ON public.lead_notes
  FOR ALL TO authenticated USING (false);

-- Grant privileges to service_role
GRANT SELECT, INSERT ON public.lead_notes TO service_role;
