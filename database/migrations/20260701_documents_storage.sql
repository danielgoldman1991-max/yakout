-- Migration: Documents storage — add missing columns, create yakout-private bucket

-- ─── 1. Documents table columns ───

alter table public.documents add column if not exists file_path text;
alter table public.documents add column if not exists file_extension text;
alter table public.documents add column if not exists storage_bucket text default 'documents';
alter table public.documents add column if not exists owner_id uuid references public.owners(id) on delete set null;
alter table public.documents add column if not exists reservation_id uuid references public.reservations(id) on delete set null;
alter table public.documents add column if not exists payment_id uuid references public.payments(id) on delete set null;
alter table public.documents add column if not exists expense_id uuid references public.expenses(id) on delete set null;

-- ─── 2. Create yakout-private bucket ───

insert into storage.buckets (id, name, public)
values ('yakout-private', 'yakout-private', false)
on conflict (id) do nothing;

-- ─── 3. Storage policies for yakout-private ───

create policy "authenticated select yakout-private"
on storage.objects for select
to authenticated
using (bucket_id = 'yakout-private');

create policy "authenticated insert yakout-private"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'yakout-private'
  and exists (
    select 1 from public.profiles
    where user_id = (select auth.uid())
      and role in ('admin','manager','staff')
  )
);

create policy "authenticated update yakout-private"
on storage.objects for update
to authenticated
using (
  bucket_id = 'yakout-private'
  and exists (
    select 1 from public.profiles
    where user_id = (select auth.uid())
      and role in ('admin','manager','staff')
  )
);

create policy "authenticated delete yakout-private"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'yakout-private'
  and exists (
    select 1 from public.profiles
    where user_id = (select auth.uid())
      and role in ('admin','manager','staff')
  )
);

-- ─── 4. Indexes ───

create index if not exists documents_file_path_idx on public.documents (file_path);
create index if not exists documents_storage_bucket_idx on public.documents (storage_bucket);
create index if not exists documents_doc_status_created_idx on public.documents (doc_status, created_at desc);
