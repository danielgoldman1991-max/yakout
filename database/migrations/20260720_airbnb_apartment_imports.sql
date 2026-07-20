alter table public.apartments add column if not exists source_platform text, add column if not exists source_listing_id text, add column if not exists source_url text, add column if not exists source_imported_at timestamptz;
create unique index if not exists apartments_source_listing_unique_idx on public.apartments(source_platform, source_listing_id) where source_platform is not null and source_listing_id is not null;

create table if not exists public.apartment_imports (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade, apartment_id uuid references public.apartments(id) on delete set null,
  source_platform text not null check (source_platform = 'airbnb'), source_listing_id text not null, source_url text not null,
  import_status text not null default 'awaiting_review' check (import_status in ('extracting','extracted','awaiting_review','importing','completed','failed','cancelled')),
  extraction_snapshot jsonb not null default '{}'::jsonb, mapped_payload jsonb not null default '{}'::jsonb, warnings jsonb not null default '[]'::jsonb, missing_fields jsonb not null default '[]'::jsonb,
  content_hash text not null, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), confirmed_at timestamptz, completed_at timestamptz, failed_at timestamptz, error_code text, error_message text,
  unique(company_id, source_platform, source_listing_id, content_hash)
);
create index if not exists apartment_imports_listing_idx on public.apartment_imports(company_id, source_platform, source_listing_id, created_at desc);
alter table public.apartment_imports enable row level security;
drop policy if exists "company members can read apartment imports" on public.apartment_imports;
create policy "company members can read apartment imports" on public.apartment_imports for select to authenticated using (company_id in (select company_id from public.profiles where user_id = auth.uid()));
