-- Indexes supporting the operational reservation calendar date-window queries.
create index if not exists reservations_calendar_apartment_dates_idx
  on public.reservations (company_id, apartment_id, check_in, check_out);

create index if not exists reservations_calendar_checkout_idx
  on public.reservations (company_id, check_out);

create index if not exists reservations_calendar_payment_idx
  on public.reservations (company_id, payment_status, check_in);

create index if not exists maintenance_calendar_due_idx
  on public.maintenance_tasks (company_id, due_date, apartment_id)
  where status not in ('cancelled', 'completed');
