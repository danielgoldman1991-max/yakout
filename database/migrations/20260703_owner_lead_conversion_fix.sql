-- Ensure owner lead conversion has the required lead fields.

alter table public.leads
  add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists converted_at timestamptz;

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new','Nouveau','A qualifier','Contacte','Devis envoye','Confirme','Perdu','A relancer','converted'));

create index if not exists leads_owner_id_idx on public.leads(owner_id);
