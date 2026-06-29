-- CRM 360 clients for Yakout dashboard.

alter table public.clients
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists preferred_language text default 'fr',
  add column if not exists client_type text default 'voyageur',
  add column if not exists status text default 'new',
  add column if not exists tags text[] default '{}',
  add column if not exists source text;

update public.clients
set source = acquisition_source
where source is null and acquisition_source is not null;

create table if not exists public.client_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_interactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  type text not null default 'note',
  channel text,
  subject text,
  content text,
  direction text default 'internal',
  status text default 'done',
  created_at timestamptz not null default now()
);

create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'normal',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  channel text not null default 'whatsapp',
  category text not null default 'general',
  subject text,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  rating integer,
  comment text,
  review_source text default 'Google Reviews',
  status text not null default 'not_requested',
  requested_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.client_notes enable row level security;
alter table public.client_interactions enable row level security;
alter table public.client_followups enable row level security;
alter table public.message_templates enable row level security;
alter table public.client_reviews enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'client_notes',
    'client_interactions',
    'client_followups',
    'message_templates',
    'client_reviews'
  ]
  loop
    execute format('drop policy if exists "%s company select" on public.%I', t, t);
    execute format('drop policy if exists "%s company insert" on public.%I', t, t);
    execute format('drop policy if exists "%s company update" on public.%I', t, t);
    execute format('drop policy if exists "%s company delete" on public.%I', t, t);
    execute format('create policy "%s company select" on public.%I for select to authenticated using (company_id = public.current_company_id())', t, t);
    execute format('create policy "%s company insert" on public.%I for insert to authenticated with check (company_id = public.current_company_id())', t, t);
    execute format('create policy "%s company update" on public.%I for update to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id())', t, t);
    execute format('create policy "%s company delete" on public.%I for delete to authenticated using (company_id = public.current_company_id())', t, t);
  end loop;
end;
$$;

create index if not exists clients_status_created_at_idx on public.clients(status, created_at desc);
create index if not exists clients_phone_idx on public.clients(phone);
create index if not exists clients_email_idx on public.clients(email);
create index if not exists client_notes_client_created_idx on public.client_notes(client_id, created_at desc);
create index if not exists client_interactions_client_created_idx on public.client_interactions(client_id, created_at desc);
create index if not exists client_followups_client_due_idx on public.client_followups(client_id, due_date);
create index if not exists client_reviews_client_created_idx on public.client_reviews(client_id, created_at desc);
create index if not exists leads_client_id_idx on public.leads(client_id);
create index if not exists reservations_client_id_idx on public.reservations(client_id);
create index if not exists trips_client_id_idx on public.trips(client_id);
create index if not exists payments_client_id_idx on public.payments(client_id);
