-- Yakout Transport & Sejours: vehicles, transfers, trips, partners, packages.
-- Run after the finance/documents migrations.

alter table public.leads
  drop constraint if exists leads_request_type_check;

alter table public.leads
  add constraint leads_request_type_check
  check (request_type in ('reservation','chauffeur','proprietaire','vehicule','services','package','general'));

alter table public.partners
  add column if not exists partner_type text,
  add column if not exists city text default 'Marrakech',
  add column if not exists company_name text,
  add column if not exists ice text,
  add column if not exists status text default 'active',
  add column if not exists service_categories text[] default '{}',
  add column if not exists commission_rate numeric(5,2),
  add column if not exists payment_terms text;

update public.partners
set
  partner_type = coalesce(partner_type, nullif(type, ''), 'other'),
  commission_rate = coalesce(commission_rate, commission),
  status = case when is_active then coalesce(status, 'active') else 'inactive' end
where partner_type is null or commission_rate is null;

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
  category = coalesce(category, 'other')
where title is null
   or public_title is null
   or public_status is null
   or price_transfer is null
   or ownership_type is null
   or category is null;

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

create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  item_type text not null,
  item_id uuid,
  item_slug text,
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

alter table public.payments
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists transfer_id uuid references public.transfers(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

alter table public.expenses
  add column if not exists transfer_id uuid references public.transfers(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

alter table public.documents
  add column if not exists partner_id uuid references public.partners(id) on delete set null,
  add column if not exists transfer_id uuid references public.transfers(id) on delete set null,
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

create index if not exists vehicles_public_status_idx on public.vehicles(company_id, public_status, slug);
create index if not exists vehicles_partner_idx on public.vehicles(partner_id);
create index if not exists vehicle_images_vehicle_idx on public.vehicle_images(vehicle_id, sort_order);
create index if not exists transfers_company_status_date_idx on public.transfers(company_id, status, pickup_date);
create index if not exists transfers_vehicle_idx on public.transfers(vehicle_id);
create index if not exists trips_package_idx on public.trips(package_id);
create index if not exists packages_public_status_idx on public.packages(company_id, public_status, slug);
create index if not exists package_items_package_idx on public.package_items(package_id, sort_order);
create index if not exists payments_transport_relations_idx on public.payments(vehicle_id, transfer_id, package_id);
create index if not exists expenses_transport_relations_idx on public.expenses(vehicle_id, transfer_id, package_id);
create index if not exists documents_transport_relations_idx on public.documents(vehicle_id, partner_id, transfer_id, trip_id, package_id);
