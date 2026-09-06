-- Create commercial conversations for the Lumyo website agent.
-- Closing the widget does not close a conversation or classify abandonment.

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_id UUID NULL,
  lead_id UUID NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'active',
  commercial_stage VARCHAR(30) NOT NULL DEFAULT 'discovery',
  primary_outcome VARCHAR(35) NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'pt',

  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_conversations_session
    FOREIGN KEY (session_id)
    REFERENCES public.visitor_sessions(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_conversations_lead
    FOREIGN KEY (lead_id)
    REFERENCES public.leads(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_conversations_status
    CHECK (
      status IN (
        'active',
        'inactive',
        'completed',
        'escalated',
        'archived'
      )
    ),

  CONSTRAINT chk_conversations_commercial_stage
    CHECK (
      commercial_stage IN (
        'discovery',
        'exploring_need',
        'qualifying',
        'suggesting_booking',
        'booking_in_progress',
        'closed'
      )
    ),

  CONSTRAINT chk_conversations_primary_outcome
    CHECK (
      primary_outcome IS NULL
      OR primary_outcome IN (
        'information_only',
        'lead_captured',
        'lead_qualified',
        'meeting_booked',
        'human_handoff',
        'not_interested',
        'possible_abandonment',
        'abandoned_before_contact',
        'abandoned_during_qualification',
        'abandoned_during_booking',
        'technical_failure',
        'spam_detected'
      )
    ),

  CONSTRAINT chk_conversations_language
    CHECK (language IN ('pt', 'en')),

  CONSTRAINT chk_conversations_lifecycle
    CHECK (
      (
        status IN ('active', 'inactive')
        AND closed_at IS NULL
        AND commercial_stage <> 'closed'
        AND primary_outcome IS NULL
      )
      OR
      (
        status IN ('completed', 'escalated', 'archived')
        AND closed_at IS NOT NULL
        AND commercial_stage = 'closed'
        AND primary_outcome IS NOT NULL
      )
    ),

  CONSTRAINT chk_conversations_closed_after_creation
    CHECK (
      closed_at IS NULL
      OR closed_at >= created_at
    ),

  CONSTRAINT chk_conversations_activity_after_creation
    CHECK (last_activity_at >= created_at),

  CONSTRAINT chk_conversations_activity_before_closure
    CHECK (
      closed_at IS NULL
      OR last_activity_at <= closed_at
    )
);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_conversations_session_id
  ON public.conversations (session_id);

CREATE INDEX idx_conversations_lead_id
  ON public.conversations (lead_id);

CREATE INDEX idx_conversations_status
  ON public.conversations (status);

CREATE INDEX idx_conversations_last_activity_at
  ON public.conversations (last_activity_at);

CREATE INDEX idx_conversations_primary_outcome
  ON public.conversations (primary_outcome);

CREATE UNIQUE INDEX uq_conversations_one_active_per_session
  ON public.conversations (session_id)
  WHERE status = 'active' AND session_id IS NOT NULL;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.conversations
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.conversations
  TO service_role;

COMMENT ON TABLE public.conversations IS
  'Commercial conversation lifecycle. Closing or minimising the widget does not close the conversation.';

COMMENT ON COLUMN public.conversations.session_id IS
  'Optional after retention. Active access always requires server-side validation of a valid session token.';

COMMENT ON COLUMN public.conversations.primary_outcome IS
  'Assigned only when the conversation is formally closed or classified after inactivity.';

COMMENT ON COLUMN public.conversations.commercial_stage IS
  'Deterministic commercial stage controlled and validated by the backend.';

COMMENT ON INDEX public.uq_conversations_one_active_per_session IS
  'Prevents concurrent active conversations for the same technical session.';
