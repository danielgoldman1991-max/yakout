-- Canonical reservation finance projection.
-- payment_allocations is the primary relation; payments.reservation_id is legacy-only.

update public.payments
set status = case
  when lower(trim(status)) in ('paid','paye','payé','completed','complete','confirmed','encaissé','encaisse','succeeded','success') then 'paid'
  when lower(trim(status)) in ('refunded','remboursé','rembourse','refund') then 'refunded'
  when lower(trim(status)) in ('failed','échec','echec','échoué','echoue','rejected') then 'failed'
  when lower(trim(status)) in ('cancelled','canceled','annulé','annule','voided','void') then 'cancelled'
  when lower(trim(status)) in ('partially_refunded','partially refunded') then 'partially_refunded'
  else 'pending'
end
where status is distinct from case
  when lower(trim(status)) in ('paid','paye','payé','completed','complete','confirmed','encaissé','encaisse','succeeded','success') then 'paid'
  when lower(trim(status)) in ('refunded','remboursé','rembourse','refund') then 'refunded'
  when lower(trim(status)) in ('failed','échec','echec','échoué','echoue','rejected') then 'failed'
  when lower(trim(status)) in ('cancelled','canceled','annulé','annule','voided','void') then 'cancelled'
  when lower(trim(status)) in ('partially_refunded','partially refunded') then 'partially_refunded'
  else 'pending'
end;

drop view if exists public.reservation_financial_summary_v;
create view public.reservation_financial_summary_v
with (security_invoker = true)
as
with canonical_links as (
  select
    pa.reservation_id,
    pa.payment_id,
    pa.amount,
    p.currency,
    p.status,
    p.direction,
    p.category
  from public.payment_allocations pa
  join public.payments p on p.id = pa.payment_id and p.company_id = pa.company_id
  where pa.reservation_id is not null
),
legacy_links as (
  select
    p.reservation_id,
    p.id as payment_id,
    p.amount,
    p.currency,
    p.status,
    p.direction,
    p.category
  from public.payments p
  where p.reservation_id is not null
    and not exists (
      select 1 from public.payment_allocations pa
      where pa.payment_id = p.id and pa.reservation_id = p.reservation_id
    )
),
all_links as (
  select * from canonical_links
  union all
  select * from legacy_links
),
aggregated as (
  select
    reservation_id,
    count(*)::integer as payment_count,
    coalesce(sum(amount) filter (
      where direction = 'inflow' and status in ('paid','partially_refunded') and category <> 'refund'
    ), 0)::numeric(12,2) as gross_paid,
    coalesce(sum(amount) filter (
      where status = 'refunded' or (direction = 'outflow' and category = 'refund' and status in ('paid','partially_refunded'))
    ), 0)::numeric(12,2) as refunded_amount,
    count(distinct upper(currency)) filter (where currency is not null) > 1 as mixed_payment_currencies,
    min(upper(currency)) filter (where currency is not null) as payment_currency
  from all_links
  group by reservation_id
)
select
  r.id as reservation_id,
  r.company_id,
  r.total_amount::numeric(12,2) as reservation_total,
  coalesce(a.gross_paid, 0)::numeric(12,2) as gross_paid,
  coalesce(a.refunded_amount, 0)::numeric(12,2) as refunded_amount,
  (coalesce(a.gross_paid, 0) - coalesce(a.refunded_amount, 0))::numeric(12,2) as net_paid,
  greatest(coalesce(r.total_amount, 0) - (coalesce(a.gross_paid, 0) - coalesce(a.refunded_amount, 0)), 0)::numeric(12,2) as balance_due,
  case
    when coalesce(a.refunded_amount, 0) > 0 and coalesce(a.gross_paid, 0) - coalesce(a.refunded_amount, 0) <= 0 then 'refunded'
    when coalesce(a.gross_paid, 0) - coalesce(a.refunded_amount, 0) > coalesce(r.total_amount, 0) then 'overpaid'
    when coalesce(a.gross_paid, 0) - coalesce(a.refunded_amount, 0) = coalesce(r.total_amount, 0) and coalesce(r.total_amount, 0) > 0 then 'paid'
    when coalesce(a.gross_paid, 0) - coalesce(a.refunded_amount, 0) > 0 then 'partially_paid'
    else 'unpaid'
  end as computed_payment_status,
  upper(coalesce(nullif(r.currency,''), 'MAD')) as currency,
  coalesce(a.payment_count, 0) as payment_count,
  coalesce(a.mixed_payment_currencies, false)
    or (a.payment_currency is not null and a.payment_currency <> upper(coalesce(nullif(r.currency,''), 'MAD'))) as currency_mismatch
from public.reservations r
left join aggregated a on a.reservation_id = r.id;

comment on view public.reservation_financial_summary_v is
  'Single reservation cash summary derived from payments and payment_allocations. Legacy direct links are read only when no canonical allocation exists.';

revoke all on public.reservation_financial_summary_v from public, anon;
grant select on public.reservation_financial_summary_v to authenticated, service_role;

notify pgrst, 'reload schema';
