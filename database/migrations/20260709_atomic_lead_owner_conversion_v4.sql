-- Atomic lead → owner conversion V4.
--
-- Changes from V3:
--   - security invoker (respects RLS — company isolation)
--   - explicit current_company_id() check for defense in depth
--   - unique constraint on owners.lead_id (prevents duplicate conversions)
--   - on conflict (lead_id) do nothing with fallback SELECT (race-safe)
--   - clear dupes before adding the constraint
--   - P0004 for company mismatch, P0001 for domain errors

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

-- ── Unique constraint on owners.lead_id ──

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

-- ── Create V4 ──

create or replace function public.convert_lead_to_owner(p_lead_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public, auth
as $$
declare
  v_lead record;
  v_owner_id uuid;
  v_current_company_id uuid;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Utilisateur non authentifie';
  end if;

  v_current_company_id := public.current_company_id();

  if v_current_company_id is null then
    raise exception using
      errcode = 'P0004',
      message = 'Aucune entreprise rattachee a votre profil';
  end if;

  select *
  into v_lead
  from public.leads
  where id = p_lead_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Lead introuvable';
  end if;

  if v_lead.company_id is distinct from v_current_company_id then
    raise exception using
      errcode = 'P0004',
      message = 'Ce lead n appartient pas a votre entreprise';
  end if;

  /*
   * 1. Association already valid
   */
  if v_lead.owner_id is not null then
    select id into v_owner_id
    from public.owners
    where id = v_lead.owner_id;

    if v_owner_id is not null then
      return v_owner_id;
    end if;

    -- Broken association — clear and continue
    update public.leads
    set owner_id = null,
        converted_at = null,
        updated_at = now()
    where id = v_lead.id;

    v_lead.owner_id := null;
  end if;

  /*
   * 2. Lookup by lead_id
   */
  select id into v_owner_id
  from public.owners
  where lead_id = v_lead.id
  order by created_at asc
  limit 1;

  /*
   * 3. Lookup by email
   */
  if v_owner_id is null
     and nullif(trim(v_lead.email), '') is not null then
    select id into v_owner_id
    from public.owners
    where lower(trim(email)) = lower(trim(v_lead.email))
    order by created_at asc
    limit 1;
  end if;

  /*
   * 4. Lookup by phone
   */
  if v_owner_id is null
     and nullif(trim(v_lead.phone), '') is not null then
    select id into v_owner_id
    from public.owners
    where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
          =
          regexp_replace(v_lead.phone, '[^0-9]', '', 'g')
    order by created_at asc
    limit 1;
  end if;

  /*
   * 5. Create owner if none found
   */
  if v_owner_id is null then
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
      v_lead.company_id,
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
      where lead_id = v_lead.id;
    end if;

    if v_owner_id is null then
      raise exception using
        errcode = 'P0001',
        message = 'echec creation proprietaire';
    end if;
  end if;

  /*
   * 6. Final link
   */
  update public.leads
  set owner_id = v_owner_id,
      status = 'converted',
      converted_at = coalesce(converted_at, now()),
      updated_at = now()
  where id = v_lead.id;

  return v_owner_id;
end;
$$;

-- ── Security ──

revoke all on function public.convert_lead_to_owner(uuid)
from public, anon;

grant execute on function public.convert_lead_to_owner(uuid)
to authenticated;
