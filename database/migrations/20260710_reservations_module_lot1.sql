-- LOT 1 — Reservation schema integrity, constraints, indexes, RLS
-- Idempotent: safe to run even if partially applied.

-- ==========================================================
-- 1. EXTENSIONS
-- ==========================================================
create extension if not exists btree_gist;

-- ==========================================================
-- 2. RESERVATION NUMBER SEQUENCE
-- ==========================================================
create sequence if not exists public.reservation_number_seq
  start with 1
  increment by 1
  no cycle;

-- ==========================================================
-- 3. ENRICH RESERVATIONS TABLE
-- ==========================================================

-- Guest contact snapshots (for historical stability)
alter table public.reservations
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists guest_country text;

-- Source & external references
alter table public.reservations
  add column if not exists source text,
  add column if not exists external_reference text,
  add column if not exists external_url text;

-- Origin links
alter table public.reservations
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists package_id uuid references public.packages(id) on delete set null;

-- Price breakdown columns
alter table public.reservations
  add column if not exists currency text not null default 'MAD',
  add column if not exists nightly_rate numeric(12,2) not null default 0,
  add column if not exists accommodation_subtotal numeric(12,2) not null default 0,
  add column if not exists cleaning_fee numeric(12,2) not null default 0,
  add column if not exists tourist_tax numeric(12,2) not null default 0,
  add column if not exists services_total numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists deposit_required numeric(12,2) not null default 0;

-- Option expiration
alter table public.reservations
  add column if not exists option_expires_at timestamptz;

-- Check-in / check-out operational tracking
alter table public.reservations
  add column if not exists arrival_time time,
  add column if not exists departure_time time,
  add column if not exists adults integer not null default 1,
  add column if not exists children integer not null default 0,
  add column if not exists infants integer not null default 0,
  add column if not exists total_guests integer not null default 1,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz;

-- Cancellation tracking
alter table public.reservations
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz;

-- Internal notes & special requests
alter table public.reservations
  add column if not exists special_requests text,
  add column if not exists internal_notes text;

-- Audit trail (who created/updated)
alter table public.reservations
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

-- Reservation number (populated by trigger)
alter table public.reservations
  add column if not exists reservation_number text;

-- Fix payment_status: drop the old French generated column, recreate with English values
-- We drop the generated column so payment status can be derived from actual payments.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'reservations' and column_name = 'payment_status'
  ) then
    alter table public.reservations drop column payment_status;
  end if;
end $$;

-- Add the new generated column for quick reference only.
-- The canonical payment status is calculated from the `payments` table.
alter table public.reservations
  add column if not exists payment_status text generated always as (
    case
      when coalesce(deposit_amount, 0) <= 0 then 'unpaid'
      when deposit_amount < total_amount then 'partial'
      else 'paid'
    end
  ) stored;

-- ==========================================================
-- 4. RESERVATION EVENTS (audit trail)
-- ==========================================================
create table if not exists public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type text not null,
  description text not null,
  old_values jsonb,
  new_values jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.reservation_events is 'Audit trail for reservation lifecycle events';
comment on column public.reservation_events.event_type is 'created | updated | confirmed | checked_in | checked_out | cancelled | no_show | expired | payment_added | payment_refunded | document_added | client_changed | apartment_changed | dates_changed | price_changed';

-- ==========================================================
-- 5. RESERVATION ITEMS (services, fees breakdown)
-- ==========================================================
create table if not exists public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  item_type text not null,
  label text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  source_type text,
  source_id uuid,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.reservation_items is 'Line items for a reservation: accommodation, cleaning, tax, transport, services, discounts';
comment on column public.reservation_items.item_type is 'accommodation | cleaning | tourist_tax | transport | package | service | discount | other';

-- ==========================================================
-- 6. BACKFILL EXISTING DATA
-- ==========================================================

-- Set reservation numbers for existing rows
update public.reservations
set reservation_number = 'RES-' || to_char(created_at, 'YYYY') || '-' || lpad((nextval('public.reservation_number_seq'))::text, 6, '0')
where reservation_number is null;

-- Backfill price breakdown from total_amount and nightly_rate calculation
update public.reservations
set
  nightly_rate = case
    when nights > 0 and total_amount > 0 then (total_amount / nights)
    else nightly_rate
  end,
  accommodation_subtotal = case
    when accommodation_subtotal = 0 and total_amount > 0 then total_amount
    else accommodation_subtotal
  end,
  currency = coalesce(nullif(trim(currency), ''), 'MAD'),
  source = coalesce(nullif(trim(source), ''), 'direct'),
  total_guests = coalesce(total_guests, people_count, 1),
  adults = case when adults = 1 and people_count > 1 then people_count else adults end,
  deposit_required = deposit_amount
where true;

-- Normalise existing statuses from French to English
update public.reservations
set reservation_status = case
  when lower(trim(reservation_status)) in ('pré-réservation', 'pre-reservation', 'draft', 'brouillon') then 'draft'
  when lower(trim(reservation_status)) in ('option') then 'option'
  when lower(trim(reservation_status)) in ('confirmée', 'confirmee', 'confirmed') then 'confirmed'
  when lower(trim(reservation_status)) in ('annulée', 'annulee', 'cancelled') then 'cancelled'
  when lower(trim(reservation_status)) in ('arrivé', 'arrive', 'checked_in', 'voyageur arrivé') then 'checked_in'
  when lower(trim(reservation_status)) in ('parti', 'checked_out', 'séjour terminé') then 'checked_out'
  when lower(trim(reservation_status)) in ('non-présentation', 'no_show') then 'no_show'
  when lower(trim(reservation_status)) in ('expirée', 'expiree', 'expired') then 'expired'
  else 'draft'
end
where reservation_status is not null;

-- ==========================================================
-- 7. NOT NULL + CHECK CONSTRAINTS
-- ==========================================================

alter table public.reservations alter column reservation_number set not null;
alter table public.reservations add constraint reservations_number_unique unique (reservation_number);

-- Check constraints (only if they don't exist)
do $$
begin
  if not exists (select 1 from information_schema.check_constraints where constraint_name = 'reservations_check_out_after_check_in') then
    alter table public.reservations add constraint reservations_check_out_after_check_in
      check (check_out > check_in);
  end if;
  if not exists (select 1 from information_schema.check_constraints where constraint_name = 'reservations_adults_positive') then
    alter table public.reservations add constraint reservations_adults_positive
      check (adults >= 1);
  end if;
  if not exists (select 1 from information_schema.check_constraints where constraint_name = 'reservations_children_non_negative') then
    alter table public.reservations add constraint reservations_children_non_negative
      check (children >= 0);
  end if;
  if not exists (select 1 from information_schema.check_constraints where constraint_name = 'reservations_infants_non_negative') then
    alter table public.reservations add constraint reservations_infants_non_negative
      check (infants >= 0);
  end if;
  if not exists (select 1 from information_schema.check_constraints where constraint_name = 'reservations_total_guests_positive') then
    alter table public.reservations add constraint reservations_total_guests_positive
      check (total_guests >= 1);
  end if;
  if not exists (select 1 from information_schema.check_constraints where constraint_name = 'reservations_amounts_non_negative') then
    alter table public.reservations add constraint reservations_amounts_non_negative
      check (
        nightly_rate >= 0
        and accommodation_subtotal >= 0
        and cleaning_fee >= 0
        and tourist_tax >= 0
        and services_total >= 0
        and discount_amount >= 0
        and total_amount >= 0
        and deposit_amount >= 0
        and deposit_required >= 0
      );
  end if;
end $$;

-- ==========================================================
-- 8. DETECT AND REPORT OVERLAPPING RESERVATIONS
-- ==========================================================
-- This query finds existing overlaps. Report them, do NOT auto-fix.
-- Run manually: SELECT * FROM public.check_reservation_overlaps()

create or replace function public.check_reservation_overlaps()
returns table (
  reservation_1_id uuid,
  reservation_1_number text,
  reservation_1_status text,
  reservation_2_id uuid,
  reservation_2_number text,
  reservation_2_status text,
  apartment_id uuid,
  r1_check_in date,
  r1_check_out date,
  r2_check_in date,
  r2_check_out date
)
language sql
stable
as $$
  select
    r1.id, r1.reservation_number, r1.reservation_status,
    r2.id, r2.reservation_number, r2.reservation_status,
    r1.apartment_id,
    r1.check_in, r1.check_out,
    r2.check_in, r2.check_out
  from public.reservations r1
  join public.reservations r2
    on r1.apartment_id = r2.apartment_id
    and r1.id < r2.id
    and daterange(r1.check_in, r1.check_out, '[)')
        &&
        daterange(r2.check_in, r2.check_out, '[)')
  where r1.reservation_status in ('option', 'confirmed', 'checked_in')
    and r2.reservation_status in ('option', 'confirmed', 'checked_in')
  order by r1.apartment_id, r1.check_in;
$$;

-- ==========================================================
-- 9. OVERLAP EXCLUSION CONSTRAINT (btree_gist)
-- ==========================================================
-- NOTE: Run 'select * from check_reservation_overlaps()' first.
-- If overlaps exist, resolve them manually before uncommenting.
-- Once clean:
-- alter table public.reservations
--   add constraint reservations_no_overlapping_stays
--   exclude using gist (
--     apartment_id with =,
--     daterange(check_in, check_out, '[)') with &&
--   )
--   where (reservation_status in ('option', 'confirmed', 'checked_in'));

-- ==========================================================
-- 10. INDEXES
-- ==========================================================
create index if not exists idx_reservations_apartment_id on public.reservations(apartment_id);
create index if not exists idx_reservations_client_id on public.reservations(client_id);
create index if not exists idx_reservations_lead_id on public.reservations(lead_id);
create index if not exists idx_reservations_package_id on public.reservations(package_id);
create index if not exists idx_reservations_status on public.reservations(reservation_status);
create index if not exists idx_reservations_check_in on public.reservations(check_in);
create index if not exists idx_reservations_check_out on public.reservations(check_out);
create index if not exists idx_reservations_created_at on public.reservations(created_at);
create index if not exists idx_reservations_number on public.reservations(reservation_number);

-- Reservation events indexes
create index if not exists idx_reservation_events_reservation on public.reservation_events(reservation_id);
create index if not exists idx_reservation_events_type on public.reservation_events(event_type);
create index if not exists idx_reservation_events_created on public.reservation_events(created_at);

-- Reservation items indexes
create index if not exists idx_reservation_items_reservation on public.reservation_items(reservation_id);
create index if not exists idx_reservation_items_type on public.reservation_items(item_type);

-- Payments index on reservation_id (if not exists)
create index if not exists idx_payments_reservation_id on public.payments(reservation_id);

-- ==========================================================
-- 11. RESERVATION NUMBER TRIGGER
-- ==========================================================
create or replace function public.assign_reservation_number()
returns trigger
language plpgsql
as $$
begin
  if new.reservation_number is null then
    new.reservation_number := 'RES-' || to_char(now(), 'YYYY') || '-' || lpad((nextval('public.reservation_number_seq'))::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_reservation_number on public.reservations;
create trigger trg_assign_reservation_number
  before insert on public.reservations
  for each row
  execute function public.assign_reservation_number();

-- ==========================================================
-- 12. RESERVATION EVENT TRIGGER (auto-log changes)
-- ==========================================================
create or replace function public.log_reservation_event()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.reservation_events (reservation_id, event_type, description, new_values, created_by)
    values (new.id, 'created', 'Reservation created', to_jsonb(new), new.created_by);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    declare
      changed jsonb;
    begin
      changed := (
        select jsonb_object_agg(key, val)
        from (
          select key, jsonb_build_object('old', to_jsonb(old_val), 'new', to_jsonb(new_val)) as val
          from jsonb_each(to_jsonb(new)) n(key, new_val)
          join jsonb_each(to_jsonb(old)) o(key, old_val) using (key)
          where new_val is distinct from old_val
            and key not in ('updated_at', 'updated_by')
        ) changes
      );
      if changed is not null and changed <> '{}'::jsonb then
        insert into public.reservation_events (reservation_id, event_type, description, old_values, new_values, created_by)
        values (
          new.id,
          case
            when new.reservation_status is distinct from old.reservation_status then 'status_changed'
            else 'updated'
          end,
          'Reservation updated',
          changed,
          to_jsonb(new),
          coalesce(new.updated_by, new.created_by)
        );
      end if;
    end;
    return new;
  end if;

  if tg_op = 'DELETE' then
    insert into public.reservation_events (reservation_id, event_type, description, old_values, created_by)
    values (old.id, 'deleted', 'Reservation deleted', to_jsonb(old), old.updated_by);
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_log_reservation_event on public.reservations;
create trigger trg_log_reservation_event
  after insert or update or delete on public.reservations
  for each row
  execute function public.log_reservation_event();

-- ==========================================================
-- 13. UPDATED_BY TRIGGER
-- ==========================================================
create or replace function public.set_reservation_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

drop trigger if exists trg_set_reservation_updated_by on public.reservations;
create trigger trg_set_reservation_updated_by
  before update on public.reservations
  for each row
  execute function public.set_reservation_updated_by();

-- ==========================================================
-- 14. RLS POLICIES
-- ==========================================================
alter table public.reservation_events enable row level security;
alter table public.reservation_items enable row level security;

-- Add new tables to the auto-policy DO loop in policies.sql manually.
-- For now, create their policies explicitly.

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
as $$
  select company_id from public.profiles where user_id = (select auth.uid()) limit 1
$$;

-- Reservation events policies
drop policy if exists "reservation_events company select" on public.reservation_events;
create policy "reservation_events company select" on public.reservation_events
  for select to authenticated
  using (
    reservation_id in (
      select id from public.reservations where company_id = public.current_company_id()
    )
  );

drop policy if exists "reservation_events company insert" on public.reservation_events;
create policy "reservation_events company insert" on public.reservation_events
  for insert to authenticated
  with check (
    reservation_id in (
      select id from public.reservations where company_id = public.current_company_id()
    )
  );

-- Reservation items policies
drop policy if exists "reservation_items company select" on public.reservation_items;
create policy "reservation_items company select" on public.reservation_items
  for select to authenticated
  using (
    reservation_id in (
      select id from public.reservations where company_id = public.current_company_id()
    )
  );

drop policy if exists "reservation_items company insert" on public.reservation_items;
create policy "reservation_items company insert" on public.reservation_items
  for insert to authenticated
  with check (
    reservation_id in (
      select id from public.reservations where company_id = public.current_company_id()
    )
  );

drop policy if exists "reservation_items company update" on public.reservation_items;
create policy "reservation_items company update" on public.reservation_items
  for update to authenticated
  using (
    reservation_id in (
      select id from public.reservations where company_id = public.current_company_id()
    )
  );

drop policy if exists "reservation_items company delete" on public.reservation_items;
create policy "reservation_items company delete" on public.reservation_items
  for delete to authenticated
  using (
    reservation_id in (
      select id from public.reservations where company_id = public.current_company_id()
    )
  );

-- ==========================================================
-- 15. RESERVATION STATUS TRANSITION FUNCTION
-- ==========================================================
create or replace function public.check_reservation_status_transition(
  old_status text,
  new_status text
)
returns boolean
language plpgsql
immutable
as $$
begin
  return case
    -- draft -> any allowed initial state
    when old_status = 'draft' and new_status in ('option', 'confirmed', 'cancelled') then true
    -- option -> confirmation, expiration, or cancellation
    when old_status = 'option' and new_status in ('confirmed', 'expired', 'cancelled') then true
    -- confirmed -> check-in, cancellation, or no-show
    when old_status = 'confirmed' and new_status in ('checked_in', 'cancelled', 'no_show') then true
    -- checked_in -> check-out
    when old_status = 'checked_in' and new_status = 'checked_out' then true
    -- checked_out -> final (no further transitions)
    when old_status = 'checked_out' then false
    -- cancelled -> no transition except explicit restoration
    when old_status = 'cancelled' then false
    -- no_show -> final
    when old_status = 'no_show' then false
    -- expired -> new option or cancellation (business rule)
    when old_status = 'expired' and new_status in ('option', 'cancelled') then true
    else false
  end;
end;
$$;

-- ==========================================================
-- 16. GRANTS
-- ==========================================================
grant usage on sequence public.reservation_number_seq to authenticated;
grant select, insert, update, delete on public.reservation_events to authenticated;
grant select, insert, update, delete on public.reservation_items to authenticated;
grant execute on function public.assign_reservation_number() to authenticated;
grant execute on function public.log_reservation_event() to authenticated;
grant execute on function public.set_reservation_updated_by() to authenticated;
grant execute on function public.check_reservation_overlaps() to authenticated;
grant execute on function public.check_reservation_status_transition(text, text) to authenticated;

-- Run after migration:
-- NOTIFY pgrst, 'reload schema';
