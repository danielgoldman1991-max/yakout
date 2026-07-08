create table if not exists public.report_definitions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  report_key text not null,
  title text not null,
  category text not null,
  version integer not null default 1,
  certification_status text not null default 'suspended'
    check (certification_status in ('draft', 'under_review', 'certified', 'suspended')),
  certified_at timestamptz,
  certified_by uuid references public.profiles(id) on delete set null,
  formula_version text,
  data_source_version text,
  last_integrity_check_at timestamptz,
  last_integrity_check_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, report_key, version)
);

create table if not exists public.report_certification_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  report_key text not null,
  filters jsonb not null default '{}'::jsonb,
  expected_totals jsonb not null default '{}'::jsonb,
  actual_totals jsonb not null default '{}'::jsonb,
  discrepancies jsonb not null default '[]'::jsonb,
  status text not null default 'failed'
    check (status in ('passed', 'failed', 'blocked')),
  executed_by uuid references public.profiles(id) on delete set null,
  executed_at timestamptz not null default now()
);

alter table public.report_definitions enable row level security;
alter table public.report_certification_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'report_definitions'
      and policyname = 'report_definitions_company_read'
  ) then
    create policy "report_definitions_company_read"
    on public.report_definitions for select
    using (
      company_id in (
        select profiles.company_id from public.profiles where profiles.user_id = auth.uid()
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'report_certification_runs'
      and policyname = 'report_certification_runs_company_read'
  ) then
    create policy "report_certification_runs_company_read"
    on public.report_certification_runs for select
    using (
      company_id in (
        select profiles.company_id from public.profiles where profiles.user_id = auth.uid()
      )
    );
  end if;
end $$;
