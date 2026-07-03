-- Add the public Transport prive request type.

drop policy if exists "public leads insert" on public.leads;

alter table public.leads
  drop constraint if exists leads_request_type_check;

alter table public.leads
  add constraint leads_request_type_check
  check (request_type in ('reservation','transport','chauffeur','proprietaire','vehicule','services','package','general'));

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
