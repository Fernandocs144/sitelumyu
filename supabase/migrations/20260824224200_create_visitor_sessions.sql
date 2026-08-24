-- Create technical visitor sessions for the Lumyo commercial agent.
-- Raw session tokens, IP addresses and user-agent values must never be stored.

CREATE TABLE public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  session_token_hash VARCHAR(64) NOT NULL,
  lead_id UUID NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,

  ip_hash VARCHAR(64) NULL,
  user_agent_hash VARCHAR(64) NULL,

  CONSTRAINT uq_visitor_sessions_session_token_hash
    UNIQUE (session_token_hash),

  CONSTRAINT fk_visitor_sessions_lead
    FOREIGN KEY (lead_id)
    REFERENCES public.leads(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_visitor_sessions_token_hash_format
    CHECK (session_token_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT chk_visitor_sessions_ip_hash_format
    CHECK (ip_hash IS NULL OR ip_hash ~ '^[0-9a-f]{64}$'),

  CONSTRAINT chk_visitor_sessions_user_agent_hash_format
    CHECK (
      user_agent_hash IS NULL
      OR user_agent_hash ~ '^[0-9a-f]{64}$'
    ),

  CONSTRAINT chk_visitor_sessions_expiry_after_creation
    CHECK (expires_at > created_at),

  CONSTRAINT chk_visitor_sessions_maximum_duration
    CHECK (expires_at <= created_at + INTERVAL '30 days'),

  CONSTRAINT chk_visitor_sessions_last_seen_after_creation
    CHECK (last_seen_at >= created_at),

  CONSTRAINT chk_visitor_sessions_last_seen_before_expiry
    CHECK (last_seen_at <= expires_at)
);

CREATE INDEX idx_visitor_sessions_lead_id
  ON public.visitor_sessions (lead_id);

CREATE INDEX idx_visitor_sessions_expires_at
  ON public.visitor_sessions (expires_at);

ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Apply least-privilege table permissions to every operational table
-- currently used by the commercial-agent backend.

REVOKE ALL ON TABLE public.leads
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON TABLE public.visitor_sessions
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.leads
  TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.visitor_sessions
  TO service_role;

COMMENT ON TABLE public.visitor_sessions IS
  'Technical sessions for anonymous or identified visitors. Access is exclusively server-side.';

COMMENT ON COLUMN public.visitor_sessions.session_token_hash IS
  'Lowercase hexadecimal SHA-256 hash of a high-entropy opaque session token. The raw token is never stored.';

COMMENT ON COLUMN public.visitor_sessions.ip_hash IS
  'Optional lowercase hexadecimal HMAC-SHA-256 of the visitor IP, calculated server-side with a private secret.';

COMMENT ON COLUMN public.visitor_sessions.user_agent_hash IS
  'Optional lowercase hexadecimal HMAC-SHA-256 of the user-agent, calculated server-side with a private secret.';

COMMENT ON COLUMN public.visitor_sessions.expires_at IS
  'Technical session expiry, which cannot exceed 30 days after creation.';
