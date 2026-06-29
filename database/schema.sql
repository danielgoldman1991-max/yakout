create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text default 'Marrakech',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','manager','staff')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, key)
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  status text not null check (status in ('active','inactive')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text,
  nationality text,
  acquisition_source text,
  notes text,
  preferences text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  request_type text not null check (request_type in ('reservation','chauffeur','proprietaire','vehicule','services','general')),
  source text not null default 'Site web',
  page_url text,
  related_type text check (related_type is null or related_type in ('apartment','vehicle')),
  related_slug text,
  message text,
  desired_date date,
  people_count integer,
  estimated_budget numeric(12,2),
  status text not null default 'new' check (status in ('new','Nouveau','A qualifier','Contacte','Devis envoye','Confirme','Perdu','A relancer')),
  internal_notes text,
  next_action text,
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  type text not null,
  phone text,
  email text,
  address text,
  commercial_terms text,
  commission numeric(8,2),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.apartments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  proprietor_partner_id uuid references public.partners(id) on delete set null,
  internal_name text not null,
  exact_address text,
  district text,
  type text,
  bedrooms integer default 0,
  capacity integer default 1,
  nightly_price numeric(12,2) default 0,
  cleaning_fee numeric(12,2) default 0,
  yakout_commission numeric(8,2) default 0,
  estimated_charges numeric(12,2) default 0,
  private_notes text,
  is_active boolean not null default true,
  public_name text not null,
  slug text not null unique,
  short_description text,
  detailed_description text,
  amenities text[] default '{}',
  price_from numeric(12,2) default 0,
  public_district text,
  image_url text,
  image_alt_text text,
  bathrooms integer default 0,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.apartment_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  internal_name text not null,
  vehicle_type text not null check (vehicle_type in ('Vehicule Yakout','Vehicule partenaire')),
  brand text,
  model text,
  registration text,
  capacity integer default 1,
  partner_cost numeric(12,2) default 0,
  commission numeric(8,2) default 0,
  private_notes text,
  availability_status text default 'Disponible',
  public_name text not null,
  slug text not null unique,
  public_description text,
  price_from numeric(12,2) default 0,
  image_url text,
  image_alt_text text,
  with_driver boolean not null default true,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  apartment_id uuid references public.apartments(id) on delete set null,
  check_in date not null,
  check_out date not null,
  nights integer generated always as (greatest(0, check_out - check_in)) stored,
  people_count integer default 1,
  total_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) generated always as (total_amount - deposit_amount) stored,
  payment_status text generated always as (case when deposit_amount = 0 then 'Non paye' when deposit_amount < total_amount then 'Partiel' else 'Paye' end) stored,
  reservation_status text not null default 'Pre-reservation',
  check_in_notes text,
  check_out_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  trip_date date not null,
  trip_time time,
  departure text not null,
  destination text not null,
  trip_type text not null default 'Autre',
  sold_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  margin numeric(12,2) generated always as (sold_price - cost_price) stored,
  payment_status text default 'Non paye',
  trip_status text default 'Demande',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  reservation_id uuid references public.reservations(id) on delete set null,
  trip_id uuid references public.trips(id) on delete set null,
  amount numeric(12,2) not null,
  paid_at date not null,
  payment_method text not null,
  activity_type text not null,
  status text not null default 'En attente',
  notes text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  apartment_id uuid references public.apartments(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  expense_date date not null,
  amount numeric(12,2) not null,
  category text not null,
  activity_type text,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  type text not null,
  file_url text not null,
  related_entity_type text,
  related_entity_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_pages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  slug text not null unique,
  title text not null,
  subtitle text,
  content text,
  cover_image_url text,
  cover_image_alt text,
  primary_button_text text,
  primary_button_url text,
  secondary_button_text text,
  secondary_button_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_sections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  page_id uuid references public.site_pages(id) on delete cascade,
  section_key text not null,
  content jsonb not null default '{}'::jsonb,
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  key text not null,
  value text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, key)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  bucket text not null,
  path text not null,
  url text not null,
  name text,
  alt_text text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, slug)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  category_id uuid references public.blog_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  cover_image_url text,
  category text,
  excerpt text,
  content text,
  author text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  meta_title text,
  meta_description text,
  keywords text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  slug text not null unique,
  short_description text,
  description text,
  image_url text,
  image_alt_text text,
  icon text,
  price_from numeric(12,2),
  is_published boolean not null default false,
  display_order integer default 0,
  meta_title text,
  meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seo_metadata (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  page_type text not null,
  page_id uuid,
  slug text,
  meta_title text,
  meta_description text,
  og_image_url text,
  keywords text[],
  canonical_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.leads(company_id, status, created_at);
create index on public.clients(company_id, created_at);
create index on public.apartments(company_id, is_published, slug);
create index on public.vehicles(company_id, is_published, slug);
create index on public.reservations(company_id, reservation_status, check_in);
create index on public.trips(company_id, trip_status, trip_date);
create index on public.payments(company_id, status, paid_at);
create index on public.expenses(company_id, category, expense_date);
create index on public.blog_posts(company_id, status, slug);
create index on public.services(company_id, is_published, display_order);
create index on public.site_pages(company_id, status, slug);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'companies','profiles','company_settings','modules','clients','leads','partners','apartments','apartment_images',
    'vehicles','vehicle_images','reservations','trips','payments','expenses','documents','site_pages','site_sections',
    'site_settings','media_assets','blog_categories','blog_posts','services','seo_metadata'
  ]
  loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;
