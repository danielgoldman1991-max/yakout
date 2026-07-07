-- Atomic lead → owner conversion V5.
--
-- Changes from V4:
--   - security definer (bypass RLS, but checks auth.uid + company inside)
--   - no set search_path (relies on default public schema)
--   - profiles.user_id = auth.uid() (our schema: profiles.user_id, not profiles.id)
--   - returns jsonb {success, owner_id, already_converted}
--   - lead company_id check against user's company_id
--   - handles broken owner_id (points to non-existent or wrong-company owner)
--   - unique constraint on owners.lead_id via DO block (safe for any state)
--   - FIX: leads_owner_id_fkey → owners(id) instead of profiles(id)

-- ── FIX: la FK leads.owner_id pointait vers profiles(id) au lieu de owners(id) ──

alter table public.leads
  drop constraint if exists leads_owner_id_fkey;

alter table public.leads
  add constraint leads_owner_id_fkey
  foreign key (owner_id)
  references public.owners(id)
  on delete set null;

-- ── Ensure schema columns ──

alter table public.leads
  add column if not exists owner_id uuid references public.owners(id) on delete set null,
  add column if not exists converted_at timestamptz;

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in ('new','Nouveau','A qualifier','Contacte','Devis envoye','Confirme','Perdu','A relancer','converted'));

create index if not exists leads_owner_id_idx
  on public.leads(owner_id);

-- ── Unique constraint on owners.lead_id (safe DO block) ──

with dupes as (
  select id, row_number() over (
    partition by lead_id order by created_at asc, id asc
  ) as rn
  from public.owners
  where lead_id is not null
)
delete from public.owners
where id in (
  select id from dupes where rn > 1
);

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'owners_lead_id_unique'
      and connamespace = (select oid from pg_catalog.pg_namespace where nspname = 'public')
  ) then
    alter table public.owners
      add constraint owners_lead_id_unique
      unique (lead_id);
  end if;
end;
$$;

-- ── Drop old version ──

drop function if exists public.convert_lead_to_owner(uuid);

-- ── Create V5 ──

create or replace function public.convert_lead_to_owner(p_lead_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_company_id uuid;
  v_lead record;
  v_owner_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Utilisateur non authentifie';
  end if;

  select p.company_id
  into v_company_id
  from public.profiles p
  where p.user_id = v_user_id;

  if v_company_id is null then
    raise exception using
      errcode = 'P0004',
      message = 'Aucune entreprise rattachee a votre profil';
  end if;

  select *
  into v_lead
  from public.leads
  where id = p_lead_id
    and company_id = v_company_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Lead introuvable ou acces interdit';
  end if;

  -- Already has a valid owner
  if v_lead.owner_id is not null then
    select id into v_owner_id
    from public.owners
    where id = v_lead.owner_id
      and company_id = v_company_id;

    if v_owner_id is not null then
      return jsonb_build_object(
        'success', true,
        'owner_id', v_owner_id,
        'already_converted', true
      );
    end if;

    -- Broken owner_id (wrong company or deleted) — clear
    update public.leads
    set owner_id = null,
        converted_at = null,
        updated_at = now()
    where id = v_lead.id;

    v_lead.owner_id := null;
  end if;

  -- Create owner
  if nullif(trim(v_lead.phone), '') is null then
    raise exception using
      errcode = 'P0001',
      message = 'Le telephone du lead est requis pour creer un proprietaire';
  end if;

  insert into public.owners (
    company_id,
    full_name,
    phone,
    email,
    city,
    country,
    preferred_contact_channel,
    source,
    status,
    lead_id,
    notes
  )
  values (
    v_company_id,
    coalesce(nullif(trim(v_lead.name), ''), 'Proprietaire Yakout'),
    nullif(trim(v_lead.phone), ''),
    nullif(lower(trim(v_lead.email)), ''),
    'Marrakech',
    'Maroc',
    'whatsapp',
    coalesce(nullif(trim(v_lead.source), ''), 'Lead conversion'),
    'lead_received',
    v_lead.id,
    coalesce(nullif(trim(v_lead.message), ''), 'Cree depuis un lead proprietaire.')
  )
  on conflict (lead_id) do nothing
  returning id into v_owner_id;

  if v_owner_id is null then
    select id into v_owner_id
    from public.owners
    where lead_id = v_lead.id
      and company_id = v_company_id;
  end if;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'echec creation proprietaire';
  end if;

  update public.leads
  set owner_id = v_owner_id,
      status = 'converted',
      converted_at = coalesce(converted_at, now()),
      updated_at = now()
  where id = v_lead.id
    and company_id = v_company_id;

  return jsonb_build_object(
    'success', true,
    'owner_id', v_owner_id,
    'already_converted', false
  );
end;
$$;

-- ── Security ──

revoke all on function public.convert_lead_to_owner(uuid) from public, anon;
grant execute on function public.convert_lead_to_owner(uuid) to authenticated;
