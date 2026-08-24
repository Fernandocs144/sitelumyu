-- Reconcile public.leads with the canonical commercial-agent model.
-- The initial migration is already applied and must remain immutable.

-- 1. Remove constraints that depend on columns or taxonomies being changed.

ALTER TABLE public.leads
  DROP CONSTRAINT chk_leads_stated_budget_source,
  DROP CONSTRAINT chk_leads_classification;

-- 2. Rename existing columns to their canonical names.

ALTER TABLE public.leads
  RENAME COLUMN stated_budget_source TO budget_normalization_source;

ALTER TABLE public.leads
  RENAME COLUMN financial_alignment TO financial_alignment_status;

ALTER TABLE public.leads
  RENAME COLUMN classification TO lead_classification;

ALTER TABLE public.leads
  RENAME COLUMN last_activity_at TO last_interaction_at;

-- 3. Rename existing constraints whose columns were renamed but whose
--    permitted values remain valid.

ALTER TABLE public.leads
  RENAME CONSTRAINT chk_leads_financial_alignment
  TO chk_leads_financial_alignment_status;

-- 4. Convert any legacy values before applying the canonical constraints.

UPDATE public.leads
SET budget_normalization_source =
  CASE budget_normalization_source
    WHEN 'visitor' THEN 'visitor_structured'
    WHEN 'agent' THEN 'model_extracted'
    WHEN 'human' THEN 'human'
    WHEN 'unknown' THEN 'unknown'
    ELSE 'unknown'
  END;

UPDATE public.leads
SET lead_classification =
  CASE lead_classification
    WHEN 'new' THEN 'informational'
    WHEN 'exploring' THEN 'potential'
    WHEN 'nurture' THEN 'potential'
    WHEN 'qualified' THEN 'qualified'
    WHEN 'priority' THEN 'priority'
    WHEN 'disqualified' THEN 'disqualified'
    ELSE 'informational'
  END;

-- 5. Apply canonical defaults.

ALTER TABLE public.leads
  ALTER COLUMN budget_normalization_source SET DEFAULT 'unknown',
  ALTER COLUMN budget_normalization_source SET NOT NULL,
  ALTER COLUMN lead_classification SET DEFAULT 'informational',
  ALTER COLUMN lead_classification SET NOT NULL;

-- 6. Add the missing structured commercial fields.

ALTER TABLE public.leads
  ADD COLUMN website_url VARCHAR(250) NULL,
  ADD COLUMN need_description TEXT NULL,
  ADD COLUMN operational_impact TEXT NULL,
  ADD COLUMN timeline VARCHAR(50) NULL,
  ADD COLUMN decision_involvement VARCHAR(50) NULL,
  ADD COLUMN intent_level VARCHAR(30) NULL,
  ADD COLUMN financial_alignment_reason TEXT NULL,
  ADD COLUMN financial_rule_version VARCHAR(20) NULL,
  ADD COLUMN financial_evaluated_at TIMESTAMPTZ NULL,
  ADD COLUMN classification_reason TEXT NULL,
  ADD COLUMN next_step VARCHAR(50) NULL,
  ADD COLUMN source VARCHAR(50) NOT NULL DEFAULT 'website_agent';

-- 7. Add the canonical constraints.

ALTER TABLE public.leads
  ADD CONSTRAINT chk_leads_budget_normalization_source
    CHECK (
      budget_normalization_source IN (
        'visitor_structured',
        'model_extracted',
        'human',
        'unknown'
      )
    ),
  ADD CONSTRAINT chk_leads_lead_classification
    CHECK (
      lead_classification IN (
        'informational',
        'potential',
        'qualified',
        'priority',
        'disqualified'
      )
    );

-- 8. Rename existing indexes so their names match the canonical columns.

ALTER INDEX public.idx_leads_classification
  RENAME TO idx_leads_lead_classification;

ALTER INDEX public.idx_leads_last_activity_at
  RENAME TO idx_leads_last_interaction_at;

-- 9. Add the missing query indexes.

CREATE INDEX idx_leads_primary_service
  ON public.leads (primary_service);

CREATE INDEX idx_leads_financial_alignment_status
  ON public.leads (financial_alignment_status);

-- 10. Document non-obvious fields.

COMMENT ON COLUMN public.leads.budget_normalization_source IS
  'Origin of the normalized budget: structured visitor input, model extraction, human adjustment, or unknown.';

COMMENT ON COLUMN public.leads.financial_alignment_status IS
  'Qualitative result returned by the private deterministic budget-alignment evaluator.';

COMMENT ON COLUMN public.leads.financial_rule_version IS
  'Version of the private deterministic rule set used for the financial evaluation.';

COMMENT ON COLUMN public.leads.lead_classification IS
  'Commercial classification assigned by validated backend rules, never directly by the language model.';

COMMENT ON COLUMN public.leads.qualification_summary IS
  'Human-readable synthesis; it does not replace the structured qualification fields.';
