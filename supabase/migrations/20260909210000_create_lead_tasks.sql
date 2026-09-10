-- Migration: Create lead_tasks table with constraints, indexes, and RLS
CREATE TABLE IF NOT EXISTS public.lead_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  due_at TIMESTAMPTZ NULL,
  assigned_to UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  completed_by UUID NULL REFERENCES public.admin_users(user_id) ON DELETE RESTRICT,

  CONSTRAINT chk_lead_tasks_title_not_empty CHECK (length(trim(both E'\r\n\t ' from title)) > 0),
  CONSTRAINT chk_lead_tasks_title_max_length CHECK (length(title) <= 255),
  CONSTRAINT chk_lead_tasks_status CHECK (status IN ('open', 'completed')),
  CONSTRAINT chk_lead_tasks_priority CHECK (priority IN ('low', 'normal', 'high')),
  CONSTRAINT chk_lead_tasks_completed_consistency CHECK (
    (status = 'open' AND completed_at IS NULL AND completed_by IS NULL) OR
    (status = 'completed' AND completed_at IS NOT NULL AND completed_by IS NOT NULL)
  )
);

-- Index for efficient retrieval of tasks by lead, status, due date, and creation date
CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_id_status_due_at
  ON public.lead_tasks (lead_id, status, due_at ASC NULLS LAST, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;

-- Block direct client access (anon and authenticated)
-- Admin operations are executed exclusively server-side via service_role client.
CREATE POLICY "No direct access for anon" ON public.lead_tasks
  FOR ALL TO anon USING (false);

CREATE POLICY "No direct access for authenticated" ON public.lead_tasks
  FOR ALL TO authenticated USING (false);

-- Grant privileges to service_role
GRANT SELECT, INSERT, UPDATE ON public.lead_tasks TO service_role;
