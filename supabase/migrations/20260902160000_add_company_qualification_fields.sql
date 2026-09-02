alter table public.leads
  add column if not exists company_activity text,
  add column if not exists target_audience text;

comment on column public.leads.company_activity is
  'Main business activity or sector explicitly stated by the visitor.';

comment on column public.leads.target_audience is
  'Main customer profile, market, or target audience explicitly stated by the visitor.';
