-- Migration: Apartments business CMS, gallery and publication controls
-- Idempotent: keeps legacy columns and adds the business fields used by the dashboard.

alter table public.apartments
  add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists internal_reference text,
  add column if not exists city text default 'Marrakech',
  add column if not exists address_private text,
  add column if not exists address_public_hint text,
  add column if not exists map_area text,
  add column if not exists property_type text,
  add column if not exists beds integer,
  add column if not exists floor text,
  add column if not exists has_elevator boolean not null default false,
  add column if not exists surface_area numeric(10,2),
  add column if not exists has_terrace boolean not null default false,
  add column if not exists has_pool boolean not null default false,
  add column if not exists has_parking boolean not null default false,
  add column if not exists price_per_night numeric(12,2),
  add column if not exists currency text not null default 'MAD',
  add column if not exists deposit_amount numeric(12,2),
  add column if not exists minimum_nights integer not null default 1,
  add column if not exists commission_rate numeric(5,2),
  add column if not exists description text,
  add column if not exists highlights text[] not null default '{}',
  add column if not exists house_rules text[] not null default '{}',
  add column if not exists check_in_time text,
  add column if not exists check_out_time text,
  add column if not exists management_status text not null default 'prospect',
  add column if not exists public_status text not null default 'draft',
  add column if not exists contract_status text not null default 'missing',
  add column if not exists onboarding_status text not null default 'incomplete',
  add column if not exists published_at timestamptz,
  add column if not exists access_instructions text,
  add column if not exists cleaning_instructions text,
  add column if not exists wifi_name text,
  add column if not exists wifi_password text,
  add column if not exists maintenance_notes text,
  add column if not exists internal_notes text;

update public.apartments
set
  price_per_night = coalesce(price_per_night, price_from, nightly_price),
  public_status = case
    when coalesce(is_published, false) then 'published'
    else coalesce(public_status, 'draft')
  end,
  published_at = case
    when coalesce(is_published, false) and published_at is null then now()
    else published_at
  end,
  description = coalesce(description, detailed_description),
  address_private = coalesce(address_private, exact_address),
  commission_rate = coalesce(commission_rate, yakout_commission)
where true;

create table if not exists public.apartment_images (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  url text,
  alt_text text,
  display_order integer default 0,
  image_url text,
  image_path text,
  image_alt_text text,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  storage_bucket text default 'yakout-media',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.apartment_images
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists url text,
  add column if not exists alt_text text,
  add column if not exists display_order integer default 0,
  add column if not exists image_url text,
  add column if not exists image_path text,
  add column if not exists image_alt_text text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_cover boolean not null default false,
  add column if not exists storage_bucket text default 'yakout-media';

update public.apartment_images
set
  image_url = coalesce(image_url, url),
  image_alt_text = coalesce(image_alt_text, alt_text),
  sort_order = coalesce(sort_order, display_order, 0),
  storage_bucket = coalesce(storage_bucket, 'yakout-media')
where true;

insert into public.apartment_images (company_id, apartment_id, url, image_url, alt_text, image_alt_text, display_order, sort_order, is_cover, storage_bucket)
select a.company_id, a.id, a.image_url, a.image_url, a.image_alt_text, a.image_alt_text, 0, 0, true, 'yakout-media'
from public.apartments a
where a.image_url is not null
  and not exists (
    select 1 from public.apartment_images ai
    where ai.apartment_id = a.id
  );

with ranked as (
  select id, row_number() over (partition by apartment_id order by sort_order, display_order, created_at) as rn
  from public.apartment_images
)
update public.apartment_images ai
set is_cover = true
from ranked r
where ai.id = r.id
  and r.rn = 1
  and not exists (
    select 1 from public.apartment_images cover
    where cover.apartment_id = ai.apartment_id and cover.is_cover = true
  );

create unique index if not exists apartment_images_one_cover_idx
  on public.apartment_images(apartment_id)
  where is_cover;

create index if not exists apartment_images_apartment_id_idx on public.apartment_images(apartment_id);
create index if not exists apartment_images_sort_order_idx on public.apartment_images(apartment_id, sort_order);
create index if not exists apartments_owner_idx on public.apartments(owner_id);
create index if not exists apartments_public_status_idx on public.apartments(public_status);
create index if not exists apartments_management_status_idx on public.apartments(management_status);

alter table public.payments
  add column if not exists apartment_id uuid references public.apartments(id) on delete set null,
  add column if not exists owner_id uuid references public.owners(id) on delete set null;

alter table public.expenses
  add column if not exists owner_id uuid references public.owners(id) on delete set null;

create index if not exists payments_apartment_id_idx on public.payments(apartment_id);
create index if not exists payments_owner_id_idx on public.payments(owner_id);
create index if not exists expenses_owner_id_idx on public.expenses(owner_id);

create or replace function public.prevent_more_than_six_apartment_images()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.apartment_images
    where apartment_id = new.apartment_id
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) >= 6 then
    raise exception 'Maximum 6 photos par appartement.';
  end if;
  return new;
end;
$$;

drop trigger if exists apartment_images_max_six on public.apartment_images;
create trigger apartment_images_max_six
  before insert on public.apartment_images
  for each row execute function public.prevent_more_than_six_apartment_images();

create or replace function public.sync_apartment_cover_image()
returns trigger
language plpgsql
as $$
declare
  cover record;
begin
  select coalesce(image_url, url) as cover_url, coalesce(image_alt_text, alt_text) as cover_alt
  into cover
  from public.apartment_images
  where apartment_id = coalesce(new.apartment_id, old.apartment_id)
  order by is_cover desc, sort_order asc, display_order asc, created_at asc
  limit 1;

  update public.apartments
  set image_url = cover.cover_url,
      image_alt_text = cover.cover_alt,
      updated_at = now()
  where id = coalesce(new.apartment_id, old.apartment_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists apartment_images_sync_cover on public.apartment_images;
create trigger apartment_images_sync_cover
  after insert or update or delete on public.apartment_images
  for each row execute function public.sync_apartment_cover_image();

insert into storage.buckets (id, name, public)
values ('yakout-media', 'yakout-media', true)
on conflict (id) do update set public = true;
