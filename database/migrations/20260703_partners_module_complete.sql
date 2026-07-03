-- Yakout Partners Module: full provider/supplier management
-- Run after 20260703_transport_stays_packages.sql
-- Idempotent: safe to run multiple times

-- ─── Partners table ───

alter table public.partners
  add column if not exists partner_type text not null default 'other',
  add column if not exists city text default 'Marrakech',
  add column if not exists company_name text,
  add column if not exists ice text,
  add column if not exists tax_id text,
  add column if not exists contact_person text,
  add column if not exists preferred_contact_channel text default 'whatsapp',
  add column if not exists whatsapp text,
  add column if not exists status text not null default 'active',
  add column if not exists service_categories text[] default '{}',
  add column if not exists zones text[] default '{}',
  add column if not exists languages text[] default '{}',
  add column if not exists commission_rate numeric(5,2),
  add column if not exists default_cost_type text,
  add column if not exists payment_terms text,
  add column if not exists bank_name text,
  add column if not exists rib text,
  add column if not exists rating integer,
  add column if not exists reliability_score integer,
  add column if not exists internal_notes text;

-- Sync type <-> partner_type for existing rows
update public.partners
set
  partner_type = coalesce(nullif(partner_type, ''), nullif(type, ''), 'other'),
  status = coalesce(nullif(status, ''), case when is_active then 'active' else 'inactive' end),
  commission_rate = coalesce(commission_rate, commission)
where partner_type is null or partner_type = '';

-- Drop old `type` column if it exists (moved to partner_type)
-- Keep for backward compat during transition

-- ─── Package items partner relation ───

alter table public.package_items
  add column if not exists partner_id uuid references public.partners(id) on delete set null;

-- ─── Indexes ───

create index if not exists partners_partner_type_idx on public.partners(partner_type);
create index if not exists partners_status_idx on public.partners(status);
create index if not exists partners_created_at_idx on public.partners(created_at desc);
create index if not exists partners_city_idx on public.partners(city);
create index if not exists partners_company_id_idx on public.partners(company_id);
create index if not exists package_items_partner_idx on public.package_items(partner_id);

-- Ensure indexes on existing relations
create index if not exists documents_partner_id_idx on public.documents(partner_id);
create index if not exists expenses_partner_id_idx on public.expenses(partner_id);
create index if not exists payments_partner_id_idx on public.payments(partner_id);

-- ─── RLS ───

alter table public.partners enable row level security;

drop policy if exists "partners_select_authenticated" on public.partners;
create policy "partners_select_authenticated" on public.partners
  for select using (
    auth.role() = 'authenticated'
    and (
      company_id = (
        select company_id from public.profiles
        where user_id = auth.uid()
        limit 1
      )
    )
  );

drop policy if exists "partners_insert_authenticated" on public.partners;
create policy "partners_insert_authenticated" on public.partners
  for insert with check (
    auth.role() = 'authenticated'
    and (
      company_id = (
        select company_id from public.profiles
        where user_id = auth.uid()
        limit 1
      )
    )
  );

drop policy if exists "partners_update_authenticated" on public.partners;
create policy "partners_update_authenticated" on public.partners
  for update using (
    auth.role() = 'authenticated'
    and (
      company_id = (
        select company_id from public.profiles
        where user_id = auth.uid()
        limit 1
      )
    )
  );

drop policy if exists "partners_delete_authenticated" on public.partners;
create policy "partners_delete_authenticated" on public.partners
  for delete using (
    auth.role() = 'authenticated'
    and (
      company_id = (
        select company_id from public.profiles
        where user_id = auth.uid()
        limit 1
      )
    )
  );
