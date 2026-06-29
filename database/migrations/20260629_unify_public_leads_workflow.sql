-- Unify all public Yakout requests into public.leads.

drop policy if exists "public leads insert" on public.leads;

alter table public.leads
  add column if not exists page_url text,
  add column if not exists related_type text,
  add column if not exists related_slug text;

alter table public.leads
  drop constraint if exists leads_request_type_check;

update public.leads
set request_type = case
  when lower(request_type) in ('reservation', 'appartement', 'réservation appartement', 'reservation appartement') then 'reservation'
  when lower(request_type) in ('chauffeur', 'chauffeur prive', 'chauffeur privé', 'transfert aeroport', 'transfert aéroport') then 'chauffeur'
  when lower(request_type) in ('proprietaire', 'propriétaire', 'confier mon bien') then 'proprietaire'
  when lower(request_type) in ('vehicule', 'véhicule', 'vehicule partenaire', 'véhicule partenaire', 'vehicule avec chauffeur', 'véhicule avec chauffeur') then 'vehicule'
  when lower(request_type) in ('services', 'service touristique', 'services touristiques', 'services sur mesure', 'tourisme') then 'services'
  else 'general'
end;

alter table public.leads
  add constraint leads_request_type_check
  check (request_type in ('reservation','chauffeur','proprietaire','vehicule','services','general'));

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  alter column status set default 'new';

alter table public.leads
  add constraint leads_status_check
  check (status in ('new','Nouveau','A qualifier','Contacte','Devis envoye','Confirme','Perdu','A relancer'));

alter table public.leads
  drop constraint if exists leads_related_type_check;

alter table public.leads
  add constraint leads_related_type_check
  check (related_type is null or related_type in ('apartment','vehicle'));

create index if not exists leads_request_type_created_at_idx on public.leads(request_type, created_at desc);
create index if not exists leads_related_slug_idx on public.leads(related_type, related_slug);
