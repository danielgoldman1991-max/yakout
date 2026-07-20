-- Idempotent compatibility migration. Review the dry-run report before applying.
update public.payments set status = case
  when lower(trim(status)) in ('paye', 'payé', 'paid', 'completed', 'complete', 'encaisse', 'encaissé', 'succeeded') then 'paid'
  when lower(trim(status)) in ('rembourse', 'remboursé', 'refunded') then 'refunded'
  when lower(trim(status)) in ('echec', 'échec', 'failed', 'rejected') then 'failed'
  when lower(trim(status)) in ('annule', 'annulé', 'cancelled', 'canceled', 'voided') then 'cancelled'
  else 'pending'
end
where status is distinct from case
  when lower(trim(status)) in ('paye', 'payé', 'paid', 'completed', 'complete', 'encaisse', 'encaissé', 'succeeded') then 'paid'
  when lower(trim(status)) in ('rembourse', 'remboursé', 'refunded') then 'refunded'
  when lower(trim(status)) in ('echec', 'échec', 'failed', 'rejected') then 'failed'
  when lower(trim(status)) in ('annule', 'annulé', 'cancelled', 'canceled', 'voided') then 'cancelled'
  else 'pending'
end;

alter table public.payments drop constraint if exists payments_status_canonical_check;
alter table public.payments add constraint payments_status_canonical_check
  check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')) not valid;
alter table public.payments validate constraint payments_status_canonical_check;

create or replace view public.reservation_financial_summary_v
with (security_invoker = true) as
select
  r.id as reservation_id,
  r.total_amount as reservation_total,
  coalesce(sum(p.amount) filter (where p.status = 'paid'), 0)::numeric(12,2) as gross_paid,
  coalesce(sum(p.amount) filter (where p.status = 'refunded' or p.payment_type = 'refund'), 0)::numeric(12,2) as refunded,
  (coalesce(sum(p.amount) filter (where p.status = 'paid'), 0) - coalesce(sum(p.amount) filter (where p.status = 'refunded' or p.payment_type = 'refund'), 0))::numeric(12,2) as net_paid,
  greatest(r.total_amount - (coalesce(sum(p.amount) filter (where p.status = 'paid'), 0) - coalesce(sum(p.amount) filter (where p.status = 'refunded' or p.payment_type = 'refund'), 0)), 0)::numeric(12,2) as balance_due,
  count(p.id)::integer as payment_count,
  coalesce(max(p.currency), 'MAD') as currency
from public.reservations r
left join public.payments p on p.reservation_id = r.id
group by r.id, r.total_amount;

revoke all on public.reservation_financial_summary_v from anon;
grant select on public.reservation_financial_summary_v to authenticated;
