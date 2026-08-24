-- Persist ordered messages for commercial-agent conversations.
-- System prompts and internal instructions must never be stored here.

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL,
  sequence_number BIGINT NOT NULL,

  message_type VARCHAR(20) NOT NULL,
  sender_role VARCHAR(15) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(15) NOT NULL DEFAULT 'delivered',

  openai_response_id VARCHAR(100) NULL,
  tool_call_id VARCHAR(100) NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT fk_messages_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id)
    ON DELETE CASCADE,

  CONSTRAINT uq_messages_conversation_sequence
    UNIQUE (conversation_id, sequence_number),

  CONSTRAINT chk_messages_sequence_positive
    CHECK (sequence_number > 0),

  CONSTRAINT chk_messages_type
    CHECK (
      message_type IN (
        'visitor_text',
        'agent_text',
        'tool_call',
        'tool_result',
        'system_notice'
      )
    ),

  CONSTRAINT chk_messages_sender_role
    CHECK (
      sender_role IN (
        'visitor',
        'agent',
        'system',
        'tool'
      )
    ),

  CONSTRAINT chk_messages_type_sender_consistency
    CHECK (
      (message_type = 'visitor_text' AND sender_role = 'visitor')
      OR (message_type = 'agent_text' AND sender_role = 'agent')
      OR (message_type = 'tool_call' AND sender_role = 'agent')
      OR (message_type = 'tool_result' AND sender_role = 'tool')
      OR (message_type = 'system_notice' AND sender_role = 'system')
    ),

  CONSTRAINT chk_messages_status
    CHECK (
      status IN (
        'pending',
        'delivered',
        'failed'
      )
    ),

  CONSTRAINT chk_messages_content_not_empty
    CHECK (length(btrim(content)) > 0),

  CONSTRAINT chk_messages_content_length
    CHECK (
      (message_type = 'visitor_text' AND char_length(content) <= 2000)
      OR (message_type = 'agent_text' AND char_length(content) <= 4000)
      OR (message_type IN ('tool_call', 'tool_result') AND char_length(content) <= 16000)
      OR (message_type = 'system_notice' AND char_length(content) <= 4000)
    )
);

CREATE INDEX idx_messages_conversation_created_at
  ON public.messages (conversation_id, created_at);

CREATE INDEX idx_messages_pending_or_failed
  ON public.messages (status)
  WHERE status IN ('pending', 'failed');

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.messages
  FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.messages
  TO service_role;

COMMENT ON TABLE public.messages IS
  'Visible conversation history, tool calls, tool results and system notices. Internal prompts are never persisted.';

COMMENT ON COLUMN public.messages.sequence_number IS
  'Positive order within a conversation. Assigned by validated backend logic.';

COMMENT ON COLUMN public.messages.content IS
  'Visitor and agent text or a bounded serialized tool payload. Never stores system prompts or private instructions.';
