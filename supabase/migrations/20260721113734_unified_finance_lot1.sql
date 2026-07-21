-- Yakout unified finance — LOT 1
-- Canonical cash ledger, multi-entity allocations, audit and reconciliation.
-- Progressive and idempotent: legacy columns remain readable during migration.

create sequence if not exists public.payment_transaction_number_seq;

alter table public.payments
  add column if not exists transaction_number text,
  add column if not exists direction text,
  add column if not exists category text,
  add column if not exists occurred_on date,
  add column if not exists due_on date,
  add column if not exists external_reference text,
  add column if not exists counterparty_type text,
  add column if not exists counterparty_id uuid,
  add column if not exists counterparty_name_snapshot text,
  add column if not exists reversed_payment_id uuid references public.payments(id) on delete restrict,
  add column if not exists idempotency_key text,
  add column if not exists is_reconciled boolean not null default false,
  add column if not exists reconciliation_id uuid,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists legacy_source_table text,
  add column if not exists legacy_source_id uuid;

update public.payments
set
  transaction_number = coalesce(
    transaction_number,
    'PAY-' || to_char(coalesce(created_at, now()), 'YYYYMMDD') || '-' ||
      lpad(nextval('public.payment_transaction_number_seq')::text, 8, '0')
  ),
  direction = coalesce(direction, case when payment_type in ('refund', 'owner_payout') then 'outflow' else 'inflow' end),
  category = coalesce(category, case
    when payment_type = 'trip' then 'transport'
    when payment_type in ('accommodation','transport','package','service','owner_payout') then payment_type
    else 'other'
  end),
  occurred_on = coalesce(occurred_on, paid_at, created_at::date),
  due_on = coalesce(due_on, due_date),
  status = case
    when lower(trim(coalesce(status, ''))) in ('en attente','pending','partial') then 'pending'
    when lower(trim(coalesce(status, ''))) in ('paye','payé','paid') then 'paid'
    when lower(trim(coalesce(status, ''))) in ('annule','annulé','cancelled') then 'cancelled'
    when lower(trim(coalesce(status, ''))) in ('rembourse','remboursé','refunded') then 'refunded'
    when lower(trim(coalesce(status, ''))) in ('failed','echec','échec') then 'failed'
    else 'draft'
  end
where true;

alter table public.payments
  alter column transaction_number set not null,
  alter column direction set not null,
  alter column category set not null,
  alter column occurred_on set not null,
  alter column currency set not null,
  alter column status set default 'draft';

alter table public.payments drop constraint if exists payments_direction_check;
alter table public.payments add constraint payments_direction_check check (direction in ('inflow','outflow'));
alter table public.payments drop constraint if exists payments_status_canonical_check;
alter table public.payments add constraint payments_status_canonical_check check (
  status in ('draft','pending','paid','failed','cancelled','partially_refunded','refunded','reversed')
);
alter table public.payments drop constraint if exists payments_category_canonical_check;
alter table public.payments add constraint payments_category_canonical_check check (category in (
  'accommodation','transport','package','service','deposit','reservation_balance','refund',
  'apartment_expense','maintenance','cleaning','partner_payment','driver_payment','owner_payout',
  'yakout_commission','operating_expense','adjustment','other'
));
alter table public.payments drop constraint if exists payments_positive_amount_check;
alter table public.payments add constraint payments_positive_amount_check check (amount > 0);
alter table public.payments drop constraint if exists payments_currency_iso_check;
alter table public.payments add constraint payments_currency_iso_check check (currency ~ '^[A-Z]{3}$');

create unique index if not exists payments_transaction_number_uidx on public.payments(transaction_number);
create unique index if not exists payments_company_idempotency_uidx
  on public.payments(company_id, idempotency_key) where idempotency_key is not null;
create unique index if not exists payments_legacy_source_uidx
  on public.payments(company_id, legacy_source_table, legacy_source_id)
  where legacy_source_table is not null and legacy_source_id is not null;
create index if not exists payments_ledger_idx on public.payments(company_id, occurred_on desc, direction, status);
create index if not exists payments_reconciliation_idx on public.payments(company_id, is_reconciled, occurred_on desc);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  reservation_id uuid references public.reservations(id) on delete restrict,
  apartment_id uuid references public.apartments(id) on delete restrict,
  client_id uuid references public.clients(id) on delete restrict,
  owner_id uuid references public.owners(id) on delete restrict,
  trip_id uuid references public.trips(id) on delete restrict,
  transfer_id uuid references public.transfers(id) on delete restrict,
  package_id uuid references public.packages(id) on delete restrict,
  maintenance_id uuid references public.maintenance_tasks(id) on delete restrict,
  partner_id uuid references public.partners(id) on delete restrict,
  service_id uuid references public.services(id) on delete restrict,
  expense_id uuid references public.expenses(id) on delete restrict,
  owner_payout_id uuid references public.owner_payouts(id) on delete restrict,
  entity_type text,
  entity_id uuid,
  allocation_category text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists payment_allocations_payment_idx on public.payment_allocations(payment_id);
create index if not exists payment_allocations_company_idx on public.payment_allocations(company_id, created_at desc);
create index if not exists payment_allocations_reservation_idx on public.payment_allocations(reservation_id) where reservation_id is not null;
create index if not exists payment_allocations_apartment_idx on public.payment_allocations(apartment_id) where apartment_id is not null;
create index if not exists payment_allocations_owner_idx on public.payment_allocations(owner_id) where owner_id is not null;
create index if not exists payment_allocations_client_idx on public.payment_allocations(client_id) where client_id is not null;
create index if not exists payment_allocations_trip_idx on public.payment_allocations(trip_id) where trip_id is not null;
create index if not exists payment_allocations_package_idx on public.payment_allocations(package_id) where package_id is not null;

create table if not exists public.payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete restrict,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  previous_data jsonb,
  new_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists payment_audit_log_payment_idx on public.payment_audit_log(payment_id, created_at desc);

alter table public.payment_allocations enable row level security;
alter table public.payment_audit_log enable row level security;

drop policy if exists "payment_allocations company select" on public.payment_allocations;
create policy "payment_allocations company select" on public.payment_allocations for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists "payment_allocations company insert" on public.payment_allocations;
create policy "payment_allocations company insert" on public.payment_allocations for insert to authenticated
  with check (company_id = public.current_company_id());
drop policy if exists "payment_audit_log company select" on public.payment_audit_log;
create policy "payment_audit_log company select" on public.payment_audit_log for select to authenticated
  using (company_id = public.current_company_id());
drop policy if exists "payment_audit_log company insert" on public.payment_audit_log;
create policy "payment_audit_log company insert" on public.payment_audit_log for insert to authenticated
  with check (company_id = public.current_company_id() and actor_id = (select auth.uid()));

create or replace function public.assert_payment_allocation_company()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_payment_company uuid;
begin
  select p.company_id into v_payment_company from public.payments p where p.id = new.payment_id;
  if v_payment_company is null or v_payment_company <> new.company_id then
    raise exception using errcode = '23514', message = 'Allocation et paiement doivent appartenir à la même organisation.';
  end if;
  if new.reservation_id is not null and not exists (select 1 from public.reservations x where x.id = new.reservation_id and x.company_id = new.company_id) then raise exception 'Réservation hors organisation.'; end if;
  if new.apartment_id is not null and not exists (select 1 from public.apartments x where x.id = new.apartment_id and x.company_id = new.company_id) then raise exception 'Appartement hors organisation.'; end if;
  if new.client_id is not null and not exists (select 1 from public.clients x where x.id = new.client_id and x.company_id = new.company_id) then raise exception 'Client hors organisation.'; end if;
  if new.owner_id is not null and not exists (select 1 from public.owners x where x.id = new.owner_id and x.company_id = new.company_id) then raise exception 'Propriétaire hors organisation.'; end if;
  if new.trip_id is not null and not exists (select 1 from public.trips x where x.id = new.trip_id and x.company_id = new.company_id) then raise exception 'Trajet hors organisation.'; end if;
  if new.transfer_id is not null and not exists (select 1 from public.transfers x where x.id = new.transfer_id and x.company_id = new.company_id) then raise exception 'Transfert hors organisation.'; end if;
  if new.package_id is not null and not exists (select 1 from public.packages x where x.id = new.package_id and x.company_id = new.company_id) then raise exception 'Pack hors organisation.'; end if;
  if new.partner_id is not null and not exists (select 1 from public.partners x where x.id = new.partner_id and x.company_id = new.company_id) then raise exception 'Partenaire hors organisation.'; end if;
  if new.maintenance_id is not null and not exists (select 1 from public.maintenance_tasks x where x.id = new.maintenance_id and x.company_id = new.company_id) then raise exception 'Maintenance hors organisation.'; end if;
  if new.service_id is not null and not exists (select 1 from public.services x where x.id = new.service_id and x.company_id = new.company_id) then raise exception 'Service hors organisation.'; end if;
  if new.expense_id is not null and not exists (select 1 from public.expenses x where x.id = new.expense_id and x.company_id = new.company_id) then raise exception 'Dépense hors organisation.'; end if;
  if new.owner_payout_id is not null and not exists (select 1 from public.owner_payouts x where x.id = new.owner_payout_id and x.company_id = new.company_id) then raise exception 'Reversement hors organisation.'; end if;
  return new;
end;
$$;

drop trigger if exists assert_payment_allocation_company on public.payment_allocations;
create trigger assert_payment_allocation_company before insert or update on public.payment_allocations
for each row execute function public.assert_payment_allocation_company();

create or replace function public.record_financial_transaction(p_transaction jsonb, p_allocations jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_company uuid := public.current_company_id();
  v_payment public.payments;
  v_allocation jsonb;
  v_allocation_total numeric(12,2) := 0;
  v_amount numeric(12,2) := round((p_transaction->>'amount')::numeric, 2);
begin
  if v_user is null or v_company is null then raise exception using errcode = '42501', message = 'Authentification et organisation requises.'; end if;
  if v_amount is null or v_amount <= 0 then raise exception using errcode = '22023', message = 'Montant invalide.'; end if;
  if jsonb_typeof(p_allocations) <> 'array' or jsonb_array_length(p_allocations) = 0 then raise exception using errcode = '22023', message = 'Une ventilation est obligatoire.'; end if;
  select coalesce(sum(round((item->>'amount')::numeric, 2)), 0) into v_allocation_total from jsonb_array_elements(p_allocations) item;
  if v_allocation_total <> v_amount then raise exception using errcode = '22023', message = 'La somme des ventilations doit être égale au montant de la transaction.'; end if;

  insert into public.payments (
    company_id, transaction_number, direction, status, category, amount, currency, occurred_on, due_on,
    paid_at, payment_method, payment_reference, external_reference, title, description, notes,
    counterparty_type, counterparty_id, counterparty_name_snapshot, reversed_payment_id,
    idempotency_key, is_reconciled, created_by, legacy_source_table, legacy_source_id,
    payment_type, payment_part, activity_type, source
  ) values (
    v_company,
    coalesce(nullif(p_transaction->>'transaction_number',''), 'PAY-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.payment_transaction_number_seq')::text, 8, '0')),
    p_transaction->>'direction', coalesce(p_transaction->>'status','draft'), p_transaction->>'category', v_amount,
    upper(p_transaction->>'currency'), (p_transaction->>'occurred_on')::date, nullif(p_transaction->>'due_on','')::date,
    coalesce(nullif(p_transaction->>'paid_at','')::date, (p_transaction->>'occurred_on')::date),
    coalesce(nullif(p_transaction->>'payment_method',''),'other'), nullif(p_transaction->>'reference',''),
    nullif(p_transaction->>'external_reference',''), nullif(p_transaction->>'title',''), nullif(p_transaction->>'description',''),
    nullif(p_transaction->>'notes',''), nullif(p_transaction->>'counterparty_type',''), nullif(p_transaction->>'counterparty_id','')::uuid,
    nullif(p_transaction->>'counterparty_name_snapshot',''), nullif(p_transaction->>'reversed_payment_id','')::uuid,
    nullif(p_transaction->>'idempotency_key',''), false, v_user, nullif(p_transaction->>'legacy_source_table',''),
    nullif(p_transaction->>'legacy_source_id','')::uuid, p_transaction->>'category', nullif(p_transaction->>'payment_part',''),
    coalesce(nullif(p_transaction->>'origin',''),'other'), coalesce(nullif(p_transaction->>'source',''),'dashboard')
  ) returning * into v_payment;

  for v_allocation in select * from jsonb_array_elements(p_allocations)
  loop
    insert into public.payment_allocations (
      company_id, payment_id, amount, reservation_id, apartment_id, client_id, owner_id, trip_id, transfer_id,
      package_id, maintenance_id, partner_id, service_id, expense_id, owner_payout_id, entity_type, entity_id,
      allocation_category, description
    ) values (
      v_company, v_payment.id, round((v_allocation->>'amount')::numeric, 2),
      nullif(v_allocation->>'reservation_id','')::uuid, nullif(v_allocation->>'apartment_id','')::uuid,
      nullif(v_allocation->>'client_id','')::uuid, nullif(v_allocation->>'owner_id','')::uuid,
      nullif(v_allocation->>'trip_id','')::uuid, nullif(v_allocation->>'transfer_id','')::uuid,
      nullif(v_allocation->>'package_id','')::uuid, nullif(v_allocation->>'maintenance_id','')::uuid,
      nullif(v_allocation->>'partner_id','')::uuid, nullif(v_allocation->>'service_id','')::uuid,
      nullif(v_allocation->>'expense_id','')::uuid, nullif(v_allocation->>'owner_payout_id','')::uuid,
      nullif(v_allocation->>'entity_type',''), nullif(v_allocation->>'entity_id','')::uuid,
      coalesce(nullif(v_allocation->>'allocation_category',''), v_payment.category), nullif(v_allocation->>'description','')
    );
  end loop;

  insert into public.payment_audit_log(company_id, payment_id, action, actor_id, new_data)
  values (v_company, v_payment.id, 'created', v_user, to_jsonb(v_payment));
  return jsonb_build_object('payment_id', v_payment.id, 'transaction_number', v_payment.transaction_number);
end;
$$;

revoke execute on function public.record_financial_transaction(jsonb, jsonb) from public, anon;
grant execute on function public.record_financial_transaction(jsonb, jsonb) to authenticated;

create or replace view public.payment_allocation_reconciliation_v
with (security_invoker = true)
as
select
  p.id as payment_id, p.company_id, p.transaction_number, p.amount, p.currency, p.direction, p.status,
  coalesce(sum(a.amount), 0)::numeric(12,2) as allocated_amount,
  (p.amount - coalesce(sum(a.amount), 0))::numeric(12,2) as allocation_difference,
  count(a.id)::integer as allocation_count
from public.payments p
left join public.payment_allocations a on a.payment_id = p.id
group by p.id;

grant select on public.payment_allocation_reconciliation_v to authenticated;
revoke all on public.payment_allocations from anon;
revoke all on public.payment_audit_log from anon;

comment on table public.payments is 'Registre financier canonique Yakout : toutes les entrées et sorties réelles.';
comment on table public.payment_allocations is 'Ventilation obligatoire des transactions vers les documents et entités métier.';
comment on table public.expenses is 'Document métier de dépense. Une dépense payée doit avoir une sortie canonique dans payments.';
