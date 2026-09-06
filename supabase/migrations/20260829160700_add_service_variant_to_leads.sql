-- Add service_variant to public.leads for differentiating website service variants.
-- Only applicable when primary_service = 'websites'.

ALTER TABLE public.leads
  ADD COLUMN service_variant VARCHAR(40) NULL;

ALTER TABLE public.leads
  ADD CONSTRAINT chk_leads_service_variant
    CHECK (
      service_variant IS NULL OR service_variant IN (
        'landing_page',
        'institutional_website',
        'custom_website',
        'ecommerce'
      )
    );

COMMENT ON COLUMN public.leads.service_variant IS
  'Specific variant of website service: landing_page, institutional_website, custom_website, or ecommerce.';
