-- Allow public lead capture while keeping dashboard access company-scoped.

alter table public.leads enable row level security;

alter table public.leads
  add column if not exists company_id uuid references public.companies(id) on delete cascade;

drop policy if exists "public leads insert" on public.leads;

create policy "public leads insert" on public.leads
  for insert
  to anon
  with check (
    company_id is not null
    and status = 'new'
    and name is not null
    and phone is not null
    and request_type in ('reservation','transport','chauffeur','proprietaire','vehicule','services','package','general')
  );
