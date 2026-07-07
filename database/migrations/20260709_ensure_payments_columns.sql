-- Ensure all columns expected by the code exist on the payments table.
-- Idempotent — safe to run even if some columns already exist.

alter table public.payments
  add column if not exists client_name text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists amount_due numeric(12,2),
  add column if not exists amount_paid numeric(12,2),
  add column if not exists currency text not null default 'MAD',
  add column if not exists payment_reference text,
  add column if not exists payment_type text not null default 'other',
  add column if not exists payment_part text,
  add column if not exists source text,
  add column if not exists due_date date,
  add column if not exists apartment_id uuid references public.apartments(id) on delete set null,
  add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists stay_check_in date,
  add column if not exists stay_check_out date,
  add column if not exists guests_count integer,
  add column if not exists refunded_at timestamptz;

-- The base schema creates status with default 'En attente' but Zod sends
-- 'pending'. Standardise the default.
alter table public.payments
  alter column status set default 'pending';

-- Backfill existing rows with sensible defaults.
update public.payments
set
  payment_type = coalesce(payment_type, case
    when coalesce(activity_type, '') in ('apartment', 'Appartement') then 'accommodation'
    when coalesce(activity_type, '') in ('transport', 'Transport') then 'transport'
    when coalesce(activity_type, '') in ('service', 'Service') then 'service'
    else 'other'
  end),
  source = coalesce(source, 'direct'),
  currency = coalesce(currency, 'MAD'),
  status = case
    when lower(trim(coalesce(status, ''))) in ('en attente', 'pending') then 'pending'
    when lower(trim(coalesce(status, ''))) in ('paye', 'paid') then 'paid'
    else lower(trim(status))
  end
where true;

-- Indexes for performance.
create index if not exists payments_apartment_id_idx on public.payments(apartment_id);
create index if not exists payments_owner_id_idx on public.payments(owner_id);
create index if not exists payments_payment_type_idx on public.payments(payment_type);
create index if not exists payments_status_idx on public.payments(status);

-- Partial index for the most common query pattern.
create index if not exists payments_accommodation_apartment_idx
  on public.payments(apartment_id, paid_at)
  where payment_type = 'accommodation';
