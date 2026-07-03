-- Migration: Accommodation revenue tracking through payments
-- Idempotent: keeps payments as the single source of truth for accommodation receipts.

alter table public.payments
  add column if not exists apartment_id uuid references public.apartments(id) on delete set null,
  add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists reservation_id uuid references public.reservations(id) on delete set null,
  add column if not exists payment_type text not null default 'other',
  add column if not exists payment_part text,
  add column if not exists source text,
  add column if not exists stay_check_in date,
  add column if not exists stay_check_out date,
  add column if not exists guests_count integer;

update public.payments
set
  payment_type = case
    when payment_type is null and coalesce(activity_type, '') in ('apartment', 'Appartement') then 'accommodation'
    when payment_type is null and coalesce(activity_type, '') in ('transport', 'Transport') then 'transport'
    when payment_type is null and coalesce(activity_type, '') in ('service', 'Service') then 'service'
    when payment_type is null then 'other'
    else payment_type
  end,
  source = coalesce(source, 'direct')
where true;

alter table public.reservations
  add column if not exists source text,
  add column if not exists guests_count integer;

update public.reservations
set guests_count = coalesce(guests_count, people_count)
where true;

create index if not exists payments_apartment_id_idx on public.payments(apartment_id);
create index if not exists payments_owner_id_idx on public.payments(owner_id);
create index if not exists payments_reservation_id_idx on public.payments(reservation_id);
create index if not exists payments_payment_type_idx on public.payments(payment_type);
create index if not exists payments_accommodation_apartment_idx
  on public.payments(apartment_id, paid_at)
  where payment_type = 'accommodation';
create index if not exists reservations_apartment_id_idx on public.reservations(apartment_id);
