-- Add converted_at to leads + allow converted status

alter table public.leads
  add column if not exists converted_at timestamptz;

drop constraint if exists leads_status_check on public.leads;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new','Nouveau','A qualifier','Contacte','Devis envoye','Confirme','Perdu','A relancer','converted'));

create index if not exists leads_client_id_idx on public.leads(client_id);
