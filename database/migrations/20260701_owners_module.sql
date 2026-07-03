-- Migration: Owners & Property Management Module
-- Crée les tables owners, owner_statements, owner_payouts, maintenance_tasks
-- Étend apartments avec owner_id et champs de gestion

-- ─── 1. Owners table ───

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  city text default 'Marrakech',
  country text default 'Maroc',
  preferred_contact_channel text default 'whatsapp',
  status text not null default 'lead_received',
  source text,
  lead_id uuid references public.leads(id) on delete set null,
  notes text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 2. Maintenance tasks ───

create table if not exists public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete cascade,
  owner_id uuid references public.owners(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','waiting_owner','completed','cancelled')),
  category text default 'other' check (category in ('cleaning','repair','plumbing','electricity','furniture','appliance','inspection','other')),
  estimated_cost numeric(12,2),
  actual_cost numeric(12,2),
  expense_id uuid references public.expenses(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 3. Owner statements ───

create table if not exists public.owner_statements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete set null,
  period_start date not null,
  period_end date not null,
  gross_revenue numeric(12,2) not null default 0,
  expenses_total numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  owner_net_amount numeric(12,2) not null default 0,
  payout_status text not null default 'draft' check (payout_status in ('draft','sent','paid','archived')),
  statement_document_id uuid references public.documents(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 4. Owner payouts ───

create table if not exists public.owner_payouts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  owner_id uuid not null references public.owners(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete set null,
  statement_id uuid references public.owner_statements(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'MAD',
  payout_method text,
  payout_status text not null default 'pending' check (payout_status in ('pending','paid','cancelled')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 5. Extend apartments ───

alter table public.apartments add column if not exists owner_id uuid references public.owners(id) on delete set null;
alter table public.apartments add column if not exists management_status text default 'prospect';
alter table public.apartments add column if not exists onboarding_status text;
alter table public.apartments add column if not exists contract_status text;
alter table public.apartments add column if not exists address_private text;
alter table public.apartments add column if not exists property_type text;
alter table public.apartments add column if not exists commission_rate numeric(5,2);
alter table public.apartments add column if not exists owner_payout_mode text default 'monthly';
alter table public.apartments add column if not exists internal_notes text;
alter table public.apartments add column if not exists published_at timestamptz;

-- ─── 6. Extend leads ───

alter table public.leads add column if not exists owner_id uuid references public.owners(id) on delete set null;

-- ─── 7. Row Level Security ───

alter table public.owners enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.owner_statements enable row level security;
alter table public.owner_payouts enable row level security;

create policy "owners company select" on public.owners for select to authenticated
  using (company_id = public.current_company_id());
create policy "owners company insert" on public.owners for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "owners company update" on public.owners for update to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "owners company delete" on public.owners for delete to authenticated
  using (company_id = public.current_company_id());

create policy "maintenance_tasks company select" on public.maintenance_tasks for select to authenticated
  using (company_id = public.current_company_id());
create policy "maintenance_tasks company insert" on public.maintenance_tasks for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "maintenance_tasks company update" on public.maintenance_tasks for update to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "maintenance_tasks company delete" on public.maintenance_tasks for delete to authenticated
  using (company_id = public.current_company_id());

create policy "owner_statements company select" on public.owner_statements for select to authenticated
  using (company_id = public.current_company_id());
create policy "owner_statements company insert" on public.owner_statements for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "owner_statements company update" on public.owner_statements for update to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "owner_statements company delete" on public.owner_statements for delete to authenticated
  using (company_id = public.current_company_id());

create policy "owner_payouts company select" on public.owner_payouts for select to authenticated
  using (company_id = public.current_company_id());
create policy "owner_payouts company insert" on public.owner_payouts for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "owner_payouts company update" on public.owner_payouts for update to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "owner_payouts company delete" on public.owner_payouts for delete to authenticated
  using (company_id = public.current_company_id());

-- ─── 8. Indexes ───

create index if not exists owners_company_status_idx on public.owners (company_id, status);
create index if not exists owners_lead_id_idx on public.owners (lead_id);
create index if not exists maintenance_apartment_idx on public.maintenance_tasks (apartment_id);
create index if not exists maintenance_status_idx on public.maintenance_tasks (status);
create index if not exists owner_statements_owner_idx on public.owner_statements (owner_id);
create index if not exists owner_payouts_owner_idx on public.owner_payouts (owner_id);
create index if not exists apartments_owner_idx on public.apartments (owner_id);
create index if not exists apartments_management_status_idx on public.apartments (management_status);

-- ─── 8. Triggers ───

drop trigger if exists set_owners_updated_at on public.owners;
create trigger set_owners_updated_at
  before update on public.owners
  for each row execute function public.set_updated_at();

drop trigger if exists set_maintenance_tasks_updated_at on public.maintenance_tasks;
create trigger set_maintenance_tasks_updated_at
  before update on public.maintenance_tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_owner_statements_updated_at on public.owner_statements;
create trigger set_owner_statements_updated_at
  before update on public.owner_statements
  for each row execute function public.set_updated_at();

drop trigger if exists set_owner_payouts_updated_at on public.owner_payouts;
create trigger set_owner_payouts_updated_at
  before update on public.owner_payouts
  for each row execute function public.set_updated_at();
