-- Migration: 20260823211122_create_leads.sql
-- Descricao: Criacao da tabela public.leads para a fundacao do Agente Comercial Lumyo

-- 1. Funcao reutilizavel para atualizacao automatica do campo updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

-- 2. Tabela de leads comerciais
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(200) NULL,
  email_normalized VARCHAR(200) GENERATED ALWAYS AS (lower(trim(email))) STORED,
  name VARCHAR(120) NULL,
  phone VARCHAR(50) NULL,
  company_name VARCHAR(120) NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'pt',
  primary_service VARCHAR(50) NULL,
  secondary_services JSONB NOT NULL DEFAULT '[]'::jsonb,
  stated_budget_min NUMERIC(12,2) NULL,
  stated_budget_max NUMERIC(12,2) NULL,
  stated_budget_currency CHAR(3) NULL DEFAULT 'EUR',
  stated_budget_period VARCHAR(20) NOT NULL DEFAULT 'unknown',
  stated_budget_raw TEXT NULL,
  stated_budget_source VARCHAR(30) NOT NULL DEFAULT 'unknown',
  budget_normalization_status VARCHAR(20) NOT NULL DEFAULT 'not_attempted',
  financial_alignment VARCHAR(25) NOT NULL DEFAULT 'unknown',
  classification VARCHAR(20) NOT NULL DEFAULT 'new',
  qualification_summary TEXT NULL,
  assigned_to VARCHAR(120) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Validades de Integridade (Constraints)
  CONSTRAINT chk_leads_email_not_empty CHECK (email IS NULL OR length(trim(email)) > 0),
  CONSTRAINT chk_leads_language CHECK (language IN ('pt', 'en')),
  CONSTRAINT chk_leads_primary_service CHECK (primary_service IS NULL OR primary_service IN ('websites', 'automation', 'ai', 'digital_growth')),
  CONSTRAINT chk_leads_secondary_services_array CHECK (jsonb_typeof(secondary_services) = 'array'),
  CONSTRAINT chk_leads_stated_budget_currency CHECK (stated_budget_currency IS NULL OR stated_budget_currency ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_leads_stated_budget_period CHECK (stated_budget_period IN ('project', 'monthly', 'unknown')),
  CONSTRAINT chk_leads_stated_budget_source CHECK (stated_budget_source IN ('visitor', 'agent', 'human', 'unknown')),
  CONSTRAINT chk_leads_budget_normalization_status CHECK (budget_normalization_status IN ('not_attempted', 'normalized', 'ambiguous', 'invalid')),
  CONSTRAINT chk_leads_financial_alignment CHECK (financial_alignment IN ('aligned', 'possibly_low', 'low_alignment', 'unknown')),
  CONSTRAINT chk_leads_classification CHECK (classification IN ('new', 'exploring', 'qualified', 'priority', 'nurture', 'disqualified')),
  CONSTRAINT chk_leads_budget_non_negative CHECK ((stated_budget_min IS NULL OR stated_budget_min >= 0) AND (stated_budget_max IS NULL OR stated_budget_max >= 0)),
  CONSTRAINT chk_leads_budget_max_gte_min CHECK (stated_budget_min IS NULL OR stated_budget_max IS NULL OR stated_budget_max >= stated_budget_min)
);

-- 3. Trigger para updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Indices prioritarios de pesquisa e ordenacao
CREATE INDEX idx_leads_email_normalized ON public.leads (email_normalized);
CREATE INDEX idx_leads_classification ON public.leads (classification);
CREATE INDEX idx_leads_last_activity_at ON public.leads (last_activity_at);

-- 5. Ativacao de Row Level Security (RLS) sem politicas publicas para anon/authenticated
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 6. Comentarios explicativos de arquitetura
COMMENT ON TABLE public.leads IS 'Tabela de leads comerciais do Agente Lumyo. Acesso restrito a chamadas server-side (sem politicas publicas RLS para anon/authenticated).';
COMMENT ON COLUMN public.leads.email_normalized IS 'Coluna gerada automaticamente via lower(trim(email)) para pesquisa insensivel a maiusculas/espacos.';
COMMENT ON COLUMN public.leads.secondary_services IS 'Lista JSONB contendo servicos secundarios/complementares de interesse.';
