-- P0 SEC-001: expose only approved apartment columns to anonymous callers.
-- Preconditions: back up schema/grants before applying. This migration does not mutate rows.

begin;

alter table public.apartments enable row level security;

drop policy if exists "Public can view published apartments" on public.apartments;
create policy "Public can view published apartments"
  on public.apartments
  for select
  to anon
  using (is_published = true);

revoke all on table public.apartments from anon;

-- security_invoker makes the view obey the caller's table privileges and RLS.
create or replace view public.public_apartments_v
with (security_invoker = true, security_barrier = true)
as
select
  id,
  public_name,
  slug,
  district,
  public_district,
  type as property_type,
  bedrooms,
  bathrooms,
  capacity,
  price_from,
  price_from as price_per_night,
  'MAD'::text as currency,
  short_description,
  detailed_description,
  amenities,
  image_url,
  image_alt_text,
  case when is_published then 'published'::text else 'draft'::text end as public_status,
  is_published,
  is_featured,
  null::timestamptz as published_at,
  meta_title,
  meta_description,
  created_at,
  updated_at
from public.apartments
where is_published = true;

revoke all on table public.public_apartments_v from public, anon, authenticated;

-- The invoker view needs only these underlying columns; private columns remain denied.
grant select (
  id, public_name, slug, district, public_district, type, bedrooms, bathrooms,
  capacity, price_from, short_description, detailed_description, amenities,
  image_url, image_alt_text, is_published, is_featured, meta_title,
  meta_description, created_at, updated_at
) on table public.apartments to anon;
grant select on table public.public_apartments_v to anon, authenticated;

commit;

-- Verification after deployment:
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_schema='public' and table_name in ('apartments','public_apartments_v');
-- select grantee, column_name from information_schema.column_privileges
-- where table_schema='public' and table_name='apartments' and grantee='anon';

-- Rollback (review before use):
-- begin;
-- drop view if exists public.public_apartments_v;
-- revoke all on table public.apartments from anon;
-- grant select on table public.apartments to anon;
-- commit;
