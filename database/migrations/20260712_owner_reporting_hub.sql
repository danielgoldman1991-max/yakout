-- Migration: Owner Reporting & Command Hub
-- Tables: owner_reports, owner_payout_items
-- Enhances: owner_payouts (new statuses, payout_items link, report link)
-- RLS, indexes, triggers

-- ─── 1. Owner Reports ───

create table if not exists public.owner_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete set null,
  report_type text not null check (report_type in (
    'monthly_owner_statement',
    'property_performance',
    'reservation_activity',
    'financial_ledger',
    'maintenance_operations',
    'owner_payout_statement',
    'forward_forecast',
    'annual_owner_summary'
  )),
  label text not null,
  period_start date not null,
  period_end date not null,
  accounting_basis text not null default 'activity' check (accounting_basis in ('activity','cash')),
  currency text not null default 'MAD',
  status text not null default 'draft' check (status in ('draft','finalized','sent','superseded','cancelled')),
  version integer not null default 1,
  snapshot jsonb not null default '{}'::jsonb,
  pdf_storage_path text,
  total_revenue numeric(12,2) default 0,
  total_expenses numeric(12,2) default 0,
  total_commission numeric(12,2) default 0,
  total_net numeric(12,2) default 0,
  generated_by uuid references public.profiles(user_id) on delete set null,
  generated_at timestamptz default now(),
  finalized_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 2. Enhance owner_payouts ───

alter table public.owner_payouts add column if not exists period_start date;
alter table public.owner_payouts add column if not exists period_end date;
alter table public.owner_payouts add column if not exists gross_amount numeric(12,2) default 0;
alter table public.owner_payouts add column if not exists deductions numeric(12,2) default 0;
alter table public.owner_payouts add column if not exists net_amount numeric(12,2) default 0;
alter table public.owner_payouts add column if not exists balance_before numeric(12,2) default 0;
alter table public.owner_payouts add column if not exists balance_after numeric(12,2) default 0;
alter table public.owner_payouts add column if not exists reference text;
alter table public.owner_payouts add column if not exists payout_date date;
alter table public.owner_payouts add column if not exists report_id uuid references public.owner_reports(id) on delete set null;

-- Widen status constraint
alter table public.owner_payouts drop constraint if exists owner_payouts_payout_status_check;
alter table public.owner_payouts add constraint owner_payouts_payout_status_check
  check (payout_status in ('draft','approved','partially_paid','paid','cancelled'));

-- ─── 3. Owner Payout Items (links to exact lines covered) ───

create table if not exists public.owner_payout_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  payout_id uuid not null references public.owner_payouts(id) on delete cascade,
  source_type text not null check (source_type in ('reservation','payment','expense','owner_statement','adjustment')),
  source_id uuid not null,
  amount numeric(12,2) not null,
  description text,
  created_at timestamptz not null default now()
);

-- ─── 4. RLS ───

alter table public.owner_reports enable row level security;
alter table public.owner_payout_items enable row level security;

create policy "owner_reports company select" on public.owner_reports for select to authenticated
  using (company_id = public.current_company_id());
create policy "owner_reports company insert" on public.owner_reports for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "owner_reports company update" on public.owner_reports for update to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "owner_reports company delete" on public.owner_reports for delete to authenticated
  using (company_id = public.current_company_id());

create policy "owner_payout_items company select" on public.owner_payout_items for select to authenticated
  using (company_id = public.current_company_id());
create policy "owner_payout_items company insert" on public.owner_payout_items for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "owner_payout_items company update" on public.owner_payout_items for update to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "owner_payout_items company delete" on public.owner_payout_items for delete to authenticated
  using (company_id = public.current_company_id());

-- (owner_payouts update/delete policies already exist from 20260701 migration)

-- ─── 5. Indexes ───

create index if not exists owner_reports_owner_idx on public.owner_reports (owner_id);
create index if not exists owner_reports_apartment_idx on public.owner_reports (apartment_id);
create index if not exists owner_reports_type_idx on public.owner_reports (report_type);
create index if not exists owner_reports_status_idx on public.owner_reports (status);
create index if not exists owner_payout_items_payout_idx on public.owner_payout_items (payout_id);
create index if not exists owner_payout_items_source_idx on public.owner_payout_items (source_type, source_id);
create index if not exists owner_payouts_report_idx on public.owner_payouts (report_id);
create index if not exists owner_payouts_period_idx on public.owner_payouts (period_start, period_end);

-- ─── 6. Triggers ───

drop trigger if exists set_owner_reports_updated_at on public.owner_reports;
create trigger set_owner_reports_updated_at
  before update on public.owner_reports
  for each row execute function public.set_updated_at();

drop trigger if exists set_owner_payout_items_updated_at on public.owner_payout_items;
create trigger set_owner_payout_items_updated_at
  before update on public.owner_payout_items
  for each row execute function public.set_updated_at();
