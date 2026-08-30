-- Add has_existing_website to public.leads to track whether visitor already has a website.
-- Semantics: NULL = unknown/not determined yet, TRUE = has website or URL provided, FALSE = explicitly does not have website.

ALTER TABLE public.leads
  ADD COLUMN has_existing_website BOOLEAN NULL;

COMMENT ON COLUMN public.leads.has_existing_website IS
  'Indicates if visitor already has a website: NULL = unknown, TRUE = has website/provided URL, FALSE = explicitly no website.';
