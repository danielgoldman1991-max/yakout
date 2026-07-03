-- ─── Payments: add missing columns ───
alter table public.payments
  add column if not exists client_name text,
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists currency text not null default 'MAD',
  add column if not exists payment_reference text,
  add column if not exists due_date date,
  add column if not exists refunded_at timestamptz;

-- ─── Expenses: add missing columns ───
alter table public.expenses
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists currency text not null default 'MAD',
  add column if not exists expense_status text not null default 'paid',
  add column if not exists payment_method text,
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists lead_id uuid references public.leads(id) on delete set null,
  add column if not exists reservation_id uuid references public.reservations(id) on delete set null,
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists supplier_name text;

-- ─── Documents: add missing columns ───
alter table public.documents
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists file_name text,
  add column if not exists file_size integer,
  add column if not exists mime_type text,
  add column if not exists related_type text,
  add column if not exists related_id uuid,
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists apartment_id uuid references public.apartments(id) on delete set null,
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null,
  add column if not exists reservation_id uuid references public.reservations(id) on delete set null,
  add column if not exists payment_id uuid references public.payments(id) on delete set null,
  add column if not exists expense_id uuid references public.expenses(id) on delete set null,
  add column if not exists expiry_date date,
  add column if not exists reminder_date date,
  add column if not exists doc_status text not null default 'active',
  add column if not exists is_private boolean not null default true;

-- ─── Indexes ───
create index if not exists payments_client_id_idx on public.payments(client_id);
create index if not exists payments_status_idx on public.payments(status);
create index if not exists expenses_category_idx on public.expenses(category);
create index if not exists expenses_status_idx on public.expenses(expense_status);
create index if not exists documents_type_idx on public.documents(type);
create index if not exists documents_related_idx on public.documents(related_type, related_id);
create index if not exists documents_status_idx on public.documents(doc_status);
