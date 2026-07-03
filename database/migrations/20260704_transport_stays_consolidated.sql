-- Yakout Transport & Séjours — Consolidated migration
-- Idempotent: safe to run any time, any number of times.
-- Supersedes: 20260703_transport_stays_packages.sql, 20260703_partners_module_complete.sql

-- ══════════════════════════════════════════════
-- 1. LEADS — fixes before FK refs exist
-- ══════════════════════════════════════════════

-- Add district column (referenced by TypeScript/Zod)
alter table public.leads
  add column if not exists district text;

-- Widen related_type CHECK to support all transport entities
alter table public.leads
  drop constraint if exists leads_related_type_check;

alter table public.leads
  add constraint leads_related_type_check
  check (
    related_type is null
    or related_type in ('apartment','vehicle','service','package','trip','transfer','owner','partner','general')
  );

-- Ensure 'package' is in request_type CHECK
alter table public.leads
  drop constraint if exists leads_request_type_check;

alter table public.leads
  add constraint leads_request_type_check
  check (request_type in ('reservation','chauffeur','proprietaire','vehicule','services','package','general'));

-- ══════════════════════════════════════════════
-- 2. PARTNERS — extended columns
-- ══════════════════════════════════════════════

alter table public.partners
  add column if not exists partner_type text default 'other',
  add column if not exists city text default 'Marrakech',
  add column if not exists company_name text,
  add column if not exists ice text,
  add column if not exists tax_id text,
  add column if not exists contact_person text,
  add column if not exists preferred_contact_channel text default 'whatsapp',
  add column if not exists whatsapp text,
  add column if not exists status text default 'active',
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

-- Sync columns for existing rows
update public.partners
set
  partner_type = coalesce(nullif(partner_type, ''), nullif(type, ''), 'other'),
  status = coalesce(nullif(status, ''), case when is_active then 'active' else 'inactive' end),
  commission_rate = coalesce(commission_rate, commission)
where partner_type is null or partner_type = '' or status is null or status = '';

-- ══════════════════════════════════════════════
-- 3. VEHICLES — extended columns
-- ══════════════════════════════════════════════

alter table public.vehicles
  alter column vehicle_type drop not null,
  add column if not exists title text,
  add column if not exists public_title text,
  add column if not exists internal_reference text,
  add column if not exists category text,
  add column if not exists luggage_capacity integer,
  add column if not exists transmission text,
  add column if not exists fuel_type text,
  add column if not exists color text,
  add column if not exists plate_number text,
  add column if not exists ownership_type text default 'partner',
  add column if not exists driver_required boolean default true,
  add column if not exists public_status text default 'draft',
  add column if not exists management_status text default 'active',
  add column if not exists price_transfer numeric(12,2),
  add column if not exists price_half_day numeric(12,2),
  add column if not exists price_full_day numeric(12,2),
  add column if not exists price_per_km numeric(12,2),
  add column if not exists currency text default 'MAD',
  add column if not exists commission_rate numeric(5,2),
  add column if not exists short_description text,
  add column if not exists description text,
  add column if not exists amenities text[] default '{}',
  add column if not exists use_cases text[] default '{}',
  add column if not exists internal_notes text,
  add column if not exists insurance_expiry_date date,
  add column if not exists technical_visit_expiry_date date,
  add column if not exists authorization_expiry_date date;

-- Sync vehicle columns for existing rows
update public.vehicles
set
  title = coalesce(title, internal_name),
  public_title = coalesce(public_title, public_name),
  plate_number = coalesce(plate_number, registration),
  commission_rate = coalesce(commission_rate, commission),
  internal_notes = coalesce(internal_notes, private_notes),
  short_description = coalesce(short_description, public_description),
  description = coalesce(description, public_description),
  public_status = coalesce(public_status, case when is_published then 'published' else 'draft' end),
  price_transfer = coalesce(price_transfer, price_from),
  ownership_type = coalesce(ownership_type, case when vehicle_type = 'Vehicule Yakout' then 'owned' else 'partner' end),
  category = coalesce(category, 'other'),
  driver_required = case when with_driver is not null then with_driver else driver_required end
where title is null
   or public_title is null
   or public_status is null
   or price_transfer is null
   or ownership_type is null
   or category is null;

-- ══════════════════════════════════════════════
-- 4. VEHICLE IMAGES — extended columns
-- ══════════════════════════════════════════════

alter table public.vehicle_images
  add column if not exists image_url text,
  add column if not exists image_path text,
  add column if not exists image_alt_text text,
  add column if not exists sort_order integer default 0,
  add column if not exists is_cover boolean default false,
  add column if not exists storage_bucket text default 'yakout-media';

update public.vehicle_images
set
  image_url = coalesce(image_url, url),
  image_alt_text = coalesce(image_alt_text, alt_text),
  sort_order = coalesce(sort_order, display_order, 0)
where image_url is null or image_alt_text is null or sort_order is null;

-- ══════════════════════════════════════════════
-- 5. TRANSFERS table
-- ══════════════════════════════════════════════

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  driver_name text,
  transfer_type text not null,
  pickup_location text,
  dropoff_location text,
  pickup_date date,
  pickup_time time,
  passengers_count integer,
  luggage_count integer,
  flight_number text,
  amount numeric(12,2) default 0,
  currency text default 'MAD',
  cost_amount numeric(12,2) default 0,
  status text default 'pending',
  payment_status text default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════
-- 6. PACKAGES table
-- ══════════════════════════════════════════════

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  public_title text,
  slug text not null unique,
  package_type text default 'custom',
  short_description text,
  description text,
  destination text,
  duration_label text,
  capacity_min integer,
  capacity_max integer,
  price_from numeric(12,2),
  currency text default 'MAD',
  public_status text default 'draft',
  is_featured boolean default false,
  image_url text,
  image_alt_text text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════
-- 7. PACKAGE_ITEMS table
-- ══════════════════════════════════════════════

create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  item_type text not null,
  item_id uuid,
  item_slug text,
  partner_id uuid references public.partners(id) on delete set null,
  title text not null,
  description text,
  quantity numeric(10,2) default 1,
  unit_label text,
  price_amount numeric(12,2),
  cost_amount numeric(12,2),
  sort_order integer default 0,
  is_optional boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════
-- 8. TRIPS — extended columns
-- ══════════════════════════════════════════════

alter table public.trips
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null,
  add column if not exists title text,
  add column if not exists destination_label text,
  add column if not exists itinerary text,
  add column if not exists pickup_location text,
  add column if not exists dropoff_location text,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists passengers_count integer,
  add column if not exists amount numeric(12,2),
  add column if not exists cost_amount numeric(12,2),
  add column if not exists currency text default 'MAD',
  add column if not exists status text default 'planned';

update public.trips
set
  title = coalesce(title, destination, trip_type, 'Trajet'),
  destination_label = coalesce(destination_label, destination),
  pickup_location = coalesce(pickup_location, departure),
  dropoff_location = coalesce(dropoff_location, destination),
  start_time = coalesce(start_time, trip_time),
  amount = coalesce(amount, sold_price),
  cost_amount = coalesce(cost_amount, cost_price),
  status = coalesce(status, lower(coalesce(trip_status, 'planned')))
where title is null or amount is null or cost_amount is null;

-- ══════════════════════════════════════════════
-- 9. PAYMENTS — FK columns for transport
-- ══════════════════════════════════════════════

alter table public.payments
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists transfer_id uuid references public.transfers(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

-- ══════════════════════════════════════════════
-- 10. EXPENSES — FK columns for transport
-- ══════════════════════════════════════════════

alter table public.expenses
  add column if not exists transfer_id uuid references public.transfers(id) on delete set null,
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

-- ══════════════════════════════════════════════
-- 11. DOCUMENTS — FK columns for transport
-- ══════════════════════════════════════════════

alter table public.documents
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists transfer_id uuid references public.transfers(id) on delete set null,
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

-- ══════════════════════════════════════════════
-- 12. INDEXES
-- ══════════════════════════════════════════════

create index if not exists partners_partner_type_idx on public.partners(partner_type);
create index if not exists partners_status_idx on public.partners(status);
create index if not exists partners_created_at_idx on public.partners(created_at desc);
create index if not exists partners_city_idx on public.partners(city);
create index if not exists partners_company_id_idx on public.partners(company_id);

create index if not exists vehicles_public_status_idx on public.vehicles(company_id, public_status, slug);
create index if not exists vehicles_partner_idx on public.vehicles(partner_id);
create index if not exists vehicle_images_vehicle_idx on public.vehicle_images(vehicle_id, sort_order);

create index if not exists transfers_company_status_date_idx on public.transfers(company_id, status, pickup_date);
create index if not exists transfers_vehicle_idx on public.transfers(vehicle_id);

create index if not exists trips_package_idx on public.trips(package_id);

create index if not exists packages_public_status_idx on public.packages(company_id, public_status, slug);
create index if not exists package_items_package_idx on public.package_items(package_id, sort_order);
create index if not exists package_items_partner_idx on public.package_items(partner_id);

create index if not exists payments_transport_relations_idx on public.payments(vehicle_id, transfer_id, package_id);
create index if not exists payments_partner_id_idx on public.payments(partner_id);

create index if not exists expenses_transport_relations_idx on public.expenses(vehicle_id, transfer_id, package_id);
create index if not exists expenses_partner_id_idx on public.expenses(partner_id);

create index if not exists documents_transport_relations_idx on public.documents(vehicle_id, partner_id, transfer_id, trip_id, package_id);
create index if not exists documents_partner_id_idx on public.documents(partner_id);

create index if not exists leads_district_idx on public.leads(district);

-- ══════════════════════════════════════════════
-- 13. RLS — transfers, packages, package_items
-- ══════════════════════════════════════════════

alter table public.transfers enable row level security;
alter table public.packages enable row level security;
alter table public.package_items enable row level security;

-- Re-apply partners RLS (idempotent)
alter table public.partners enable row level security;

do $$
declare
  tbl text;
  pol_name text;
begin
  foreach tbl in array array['transfers','packages','package_items','partners']
  loop
    foreach pol_name in array array['select','insert','update','delete']
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        tbl || '_' || pol_name || '_authenticated',
        tbl
      );
    end loop;
  end loop;
end;
$$;

create policy "transfers_select_authenticated" on public.transfers
  for select using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "transfers_insert_authenticated" on public.transfers
  for insert with check (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "transfers_update_authenticated" on public.transfers
  for update using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "transfers_delete_authenticated" on public.transfers
  for delete using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "packages_select_authenticated" on public.packages
  for select using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "packages_insert_authenticated" on public.packages
  for insert with check (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "packages_update_authenticated" on public.packages
  for update using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "packages_delete_authenticated" on public.packages
  for delete using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "package_items_select_authenticated" on public.package_items
  for select using (
    auth.role() = 'authenticated'
    and (
      package_id in (
        select id from public.packages
        where company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
      )
    )
  );

create policy "package_items_insert_authenticated" on public.package_items
  for insert with check (
    auth.role() = 'authenticated'
    and (
      package_id in (
        select id from public.packages
        where company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
      )
    )
  );

create policy "package_items_update_authenticated" on public.package_items
  for update using (
    auth.role() = 'authenticated'
    and (
      package_id in (
        select id from public.packages
        where company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
      )
    )
  );

create policy "package_items_delete_authenticated" on public.package_items
  for delete using (
    auth.role() = 'authenticated'
    and (
      package_id in (
        select id from public.packages
        where company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
      )
    )
  );

-- Partners RLS (same pattern, idempotent)
create policy "partners_select_authenticated" on public.partners
  for select using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "partners_insert_authenticated" on public.partners
  for insert with check (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "partners_update_authenticated" on public.partners
  for update using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

create policy "partners_delete_authenticated" on public.partners
  for delete using (
    auth.role() = 'authenticated'
    and (
      company_id = (select company_id from public.profiles where user_id = auth.uid() limit 1)
    )
  );

-- ══════════════════════════════════════════════
-- 14. updated_at TRIGGERS for new tables
-- ══════════════════════════════════════════════

create trigger set_transfers_updated_at
  before update on public.transfers
  for each row execute function public.set_updated_at();

create trigger set_packages_updated_at
  before update on public.packages
  for each row execute function public.set_updated_at();

create trigger set_package_items_updated_at
  before update on public.package_items
  for each row execute function public.set_updated_at();
