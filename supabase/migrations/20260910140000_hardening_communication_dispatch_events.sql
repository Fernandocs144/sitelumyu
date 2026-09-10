-- Migration: Hardening of communication_dispatch_events
-- Date: 2026-09-10
-- Add svix_id and provider_event_at columns and partial unique indexes for transport and factual deduplication.

ALTER TABLE communication_dispatch_events 
ADD COLUMN IF NOT EXISTS svix_id TEXT NULL,
ADD COLUMN IF NOT EXISTS provider_event_at TIMESTAMPTZ NULL;

-- Partial unique index for transport deduplication (svix_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispatch_events_svix_id_unique 
ON communication_dispatch_events (svix_id) 
WHERE svix_id IS NOT NULL;

-- Partial unique index for factual event deduplication (provider_message_id, event_type, provider_event_at)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispatch_events_factual_unique 
ON communication_dispatch_events (provider_message_id, event_type, provider_event_at) 
WHERE provider_event_at IS NOT NULL;
