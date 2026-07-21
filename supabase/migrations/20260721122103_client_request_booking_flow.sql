-- Lead -> client -> request booking workflow.
-- The lead is the immutable source request in the current Yakout schema.

alter table public.leads
  add column if not exists converted_by uuid references auth.users(id) on delete set null,
  add column if not exists booking_status text not null default 'new';

alter table public.leads drop constraint if exists leads_booking_status_check;
alter table public.leads add constraint leads_booking_status_check check (
  booking_status in ('new','qualified','converted','booking_pending','partially_booked','booked','declined','cancelled')
);

alter table public.reservations
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists source_request_id uuid references public.leads(id) on delete set null,
  add column if not exists created_from text,
  add column if not exists original_request_snapshot jsonb,
  add column if not exists idempotency_key text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists currency text not null default 'MAD';

-- Unknown commercial prices stay NULL. They are never represented by a fake zero.
alter table public.reservations alter column total_amount drop not null;
alter table public.reservations alter column total_amount drop default;
alter table public.reservations alter column deposit_amount drop not null;
alter table public.reservations alter column deposit_amount drop default;

create unique index if not exists reservations_request_kind_unique
  on public.reservations(company_id, source_request_id, created_from)
  where source_request_id is not null and created_from = 'client_request';
create unique index if not exists reservations_idempotency_unique
  on public.reservations(company_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.package_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  package_id uuid not null references public.packages(id) on delete restrict,
  check_in date,
  check_out date,
  guests_count integer not null default 1 check (guests_count > 0),
  expected_amount numeric(12,2),
  currency text not null default 'MAD',
  status text not null default 'draft' check (status in ('draft','pending_confirmation','confirmed','cancelled')),
  original_request_snapshot jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, idempotency_key)
);

create table if not exists public.transport_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  booking_type text not null default 'transfer',
  pickup_date date,
  pickup_time time,
  passengers_count integer not null default 1 check (passengers_count > 0),
  pickup_location text,
  dropoff_location text,
  flight_number text,
  expected_amount numeric(12,2),
  currency text not null default 'MAD',
  status text not null default 'draft' check (status in ('draft','pending_confirmation','confirmed','cancelled')),
  original_request_snapshot jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, idempotency_key)
);

alter table public.package_bookings enable row level security;
alter table public.transport_bookings enable row level security;

create policy "package bookings company access" on public.package_bookings for all to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
create policy "transport bookings company access" on public.transport_bookings for all to authenticated
  using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

grant select, insert, update on public.package_bookings to authenticated;
grant select, insert, update on public.transport_bookings to authenticated;

create or replace function public.convert_lead_to_client(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_lead public.leads%rowtype;
  v_client_id uuid;
  v_phone text;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  select * into v_lead from public.leads where id = p_lead_id for update;
  if not found then raise exception 'LEAD_NOT_FOUND'; end if;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id and p.company_id = v_lead.company_id) then
    raise exception 'LEAD_FORBIDDEN' using errcode = '42501';
  end if;
  if v_lead.client_id is not null then return v_lead.client_id; end if;
  v_phone := regexp_replace(coalesce(v_lead.phone,''), '[^0-9+]', '', 'g');
  select c.id into v_client_id from public.clients c
    where c.company_id = v_lead.company_id
      and ((v_lead.email is not null and lower(c.email) = lower(v_lead.email)) or regexp_replace(c.phone, '[^0-9+]', '', 'g') = v_phone)
    order by case when v_lead.email is not null and lower(c.email) = lower(v_lead.email) then 0 else 1 end, c.created_at
    limit 1 for update;
  if v_client_id is null then
    insert into public.clients(company_id, full_name, phone, email, acquisition_source, notes)
    values(v_lead.company_id, v_lead.name, v_lead.phone, v_lead.email, v_lead.source, v_lead.message)
    returning id into v_client_id;
  end if;
  update public.leads set client_id = v_client_id, status = 'converted', booking_status = 'converted',
    converted_at = coalesce(converted_at, now()), converted_by = coalesce(converted_by, v_user_id), updated_at = now()
  where id = p_lead_id;
  return v_client_id;
end;
$$;

revoke execute on function public.convert_lead_to_client(uuid) from public, anon;
grant execute on function public.convert_lead_to_client(uuid) to authenticated;

create or replace function public.create_booking_from_client_request(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_lead public.leads%rowtype;
  v_company_id uuid;
  v_client_id uuid;
  v_kind text := coalesce(nullif(p_request->>'kind',''), 'accommodation');
  v_key text := nullif(p_request->>'idempotency_key','');
  v_reservation_id uuid;
  v_package_booking_id uuid;
  v_transport_booking_id uuid;
  v_apartment_id uuid := nullif(p_request->>'apartment_id','')::uuid;
  v_package_id uuid := nullif(p_request->>'package_id','')::uuid;
  v_check_in date := nullif(p_request->>'check_in','')::date;
  v_check_out date := nullif(p_request->>'check_out','')::date;
  v_guests integer := greatest(coalesce(nullif(p_request->>'guests_count','')::integer, 1), 1);
  v_expected numeric := nullif(p_request->>'expected_amount','')::numeric;
  v_currency text := upper(coalesce(nullif(p_request->>'currency',''), 'MAD'));
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if v_key is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  select * into v_lead from public.leads where id = nullif(p_request->>'lead_id','')::uuid for update;
  if not found or v_lead.client_id is null then raise exception 'REQUEST_NOT_CONVERTED'; end if;
  v_company_id := v_lead.company_id; v_client_id := v_lead.client_id;
  if not exists (select 1 from public.profiles p where p.user_id = v_user_id and p.company_id = v_company_id) then
    raise exception 'REQUEST_FORBIDDEN' using errcode = '42501';
  end if;
  if v_lead.booking_status in ('booked','declined','cancelled') then raise exception 'REQUEST_ALREADY_PROCESSED'; end if;

  if v_kind in ('accommodation','composite_stay') and v_apartment_id is not null then
    if v_check_in is null or v_check_out is null or v_check_out <= v_check_in then raise exception 'INVALID_DATES'; end if;
    if not exists (select 1 from public.apartments a where a.id = v_apartment_id and a.company_id = v_company_id and a.capacity >= v_guests) then raise exception 'APARTMENT_UNAVAILABLE_OR_CAPACITY'; end if;
    if exists (select 1 from public.reservations r where r.apartment_id = v_apartment_id and r.reservation_status in ('option','confirmed','checked_in') and daterange(r.check_in,r.check_out,'[)') && daterange(v_check_in,v_check_out,'[)')) then raise exception 'APARTMENT_DATE_CONFLICT'; end if;
    insert into public.reservations(company_id,client_id,apartment_id,check_in,check_out,people_count,total_amount,deposit_amount,reservation_status,lead_id,source_request_id,created_from,original_request_snapshot,idempotency_key,created_by,currency)
    values(v_company_id,v_client_id,v_apartment_id,v_check_in,v_check_out,v_guests,v_expected,null,'draft',v_lead.id,v_lead.id,'client_request',to_jsonb(v_lead),v_key||':accommodation',v_user_id,v_currency)
    on conflict (company_id,idempotency_key) where idempotency_key is not null do update set updated_at = public.reservations.updated_at
    returning id into v_reservation_id;
  end if;

  if v_kind in ('package','composite_stay') and v_package_id is not null then
    insert into public.package_bookings(company_id,client_id,lead_id,package_id,check_in,check_out,guests_count,expected_amount,currency,idempotency_key,created_by,original_request_snapshot)
    values(v_company_id,v_client_id,v_lead.id,v_package_id,v_check_in,v_check_out,v_guests,v_expected,v_currency,v_key||':package',v_user_id,to_jsonb(v_lead))
    on conflict(company_id,idempotency_key) do update set updated_at = public.package_bookings.updated_at returning id into v_package_booking_id;
  end if;

  if v_kind in ('transport','chauffeur','composite_stay') and coalesce((p_request->>'include_transport')::boolean, v_kind <> 'composite_stay') then
    insert into public.transport_bookings(company_id,client_id,lead_id,booking_type,pickup_date,pickup_time,passengers_count,pickup_location,dropoff_location,flight_number,expected_amount,currency,idempotency_key,created_by,original_request_snapshot)
    values(v_company_id,v_client_id,v_lead.id,v_kind,nullif(p_request->>'transport_date','')::date,nullif(p_request->>'transport_time','')::time,v_guests,p_request->>'pickup_location',p_request->>'dropoff_location',p_request->>'flight_number',v_expected,v_currency,v_key||':transport',v_user_id,to_jsonb(v_lead))
    on conflict(company_id,idempotency_key) do update set updated_at = public.transport_bookings.updated_at returning id into v_transport_booking_id;
  end if;

  if v_reservation_id is null and v_package_booking_id is null and v_transport_booking_id is null then raise exception 'NO_BOOKING_COMPONENT'; end if;
  update public.leads set booking_status = case when v_kind = 'composite_stay' and (v_reservation_id is null or v_package_booking_id is null or v_transport_booking_id is null) then 'partially_booked' else 'booked' end, updated_at = now() where id = v_lead.id;
  return jsonb_build_object('reservation_id',v_reservation_id,'package_booking_id',v_package_booking_id,'transport_booking_id',v_transport_booking_id,'client_id',v_client_id);
end;
$$;

revoke execute on function public.create_booking_from_client_request(jsonb) from public, anon;
grant execute on function public.create_booking_from_client_request(jsonb) to authenticated;

notify pgrst, 'reload schema';
