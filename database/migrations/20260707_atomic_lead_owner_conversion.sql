-- Atomic, idempotent conversion from a proprietor lead to an owner.
-- The function returns the real public.owners.id and never writes leads.owner_id
-- before the owner row has been found or created inside the same transaction.
--
-- V2: security definer + recovery flow for invalid lead.owner_id associations.
--     When lead.owner_id points to a non-existent owner, the function
--     searches by lead_id, email, then phone. If a match is found the link
--     is repaired. Otherwise the invalid owner_id is cleared and a new
--     owner is created.

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

create index if not exists owners_lead_id_idx
  on public.owners(lead_id)
  where lead_id is not null;

create index if not exists owners_email_lookup_idx
  on public.owners(lower(trim(email)))
  where email is not null and trim(email) <> '';

create or replace function public.convert_lead_to_owner(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;
  v_owner_id uuid;
  v_owner_count integer;
  v_email text;
  v_phone text;
  v_normalized_phone text;
begin
  select *
  into v_lead
  from public.leads
  where id = p_lead_id
  for update;

  if not found then
    raise exception 'lead introuvable';
  end if;

  v_email := nullif(lower(trim(coalesce(v_lead.email, ''))), '');
  v_phone := nullif(trim(coalesce(v_lead.phone, '')), '');

  -- ── Case 1: lead already has an owner_id ──
  if v_lead.owner_id is not null then
    if exists (select 1 from public.owners where id = v_lead.owner_id) then
      return v_lead.owner_id;
    end if;

    -- Invalid association — try to recover by searching existing owners
    select id into v_owner_id
    from public.owners
    where lead_id = v_lead.id
    limit 1;

    if v_owner_id is not null then
      update public.leads set owner_id = v_owner_id where id = v_lead.id;
      return v_owner_id;
    end if;

    if v_email is not null then
      select id into v_owner_id
      from public.owners
      where lower(trim(coalesce(email, ''))) = v_email
      limit 1;

      if v_owner_id is not null then
        update public.leads set owner_id = v_owner_id where id = v_lead.id;
        return v_owner_id;
      end if;
    end if;

    if v_phone is not null then
      v_normalized_phone := regexp_replace(v_phone, '[[:space:]_().-]', '', 'g');
      v_normalized_phone := regexp_replace(v_normalized_phone, '^00212', '+212');
      v_normalized_phone := regexp_replace(v_normalized_phone, '^0', '+212');

      select id into v_owner_id
      from public.owners
      where regexp_replace(
        regexp_replace(regexp_replace(coalesce(phone, ''), '[[:space:]_().-]', '', 'g'), '^00212', '+212'),
        '^0', '+212'
      ) = v_normalized_phone
      limit 1;

      if v_owner_id is not null then
        update public.leads set owner_id = v_owner_id where id = v_lead.id;
        return v_owner_id;
      end if;
    end if;

    -- Recovery failed — clear the invalid association and proceed
    update public.leads
    set owner_id = null,
        converted_at = null
    where id = v_lead.id;

    -- Re-read the cleared lead
    select *
    into v_lead
    from public.leads
    where id = p_lead_id
    for update;

    v_email := nullif(lower(trim(coalesce(v_lead.email, ''))), '');
    v_phone := nullif(trim(coalesce(v_lead.phone, '')), '');
  end if;

  -- ── Case 2: no owner_id (or was just cleared) ──

  v_owner_count := 0;
  select count(*) into v_owner_count
  from public.owners
  where lead_id = v_lead.id;

  if v_owner_count > 1 then
    raise exception 'Plusieurs proprietaires correspondent a ce lead';
  elsif v_owner_count = 1 then
    select id into v_owner_id
    from public.owners
    where lead_id = v_lead.id
    order by created_at asc, id::text asc
    limit 1;

    update public.leads
    set owner_id = v_owner_id,
        status = 'converted',
        converted_at = now()
    where id = v_lead.id;

    return v_owner_id;
  end if;

  if v_email is not null then
    select count(*) into v_owner_count
    from public.owners
    where lower(trim(coalesce(email, ''))) = v_email;

    if v_owner_count > 1 then
      raise exception 'Plusieurs proprietaires correspondent a cet email';
    elsif v_owner_count = 1 then
      select id into v_owner_id
      from public.owners
      where lower(trim(coalesce(email, ''))) = v_email
      order by created_at asc, id::text asc
      limit 1;

      update public.leads
      set owner_id = v_owner_id,
          status = 'converted',
          converted_at = now()
      where id = v_lead.id;

      return v_owner_id;
    end if;
  end if;

  if v_phone is not null then
    v_normalized_phone := regexp_replace(v_phone, '[[:space:]_().-]', '', 'g');
    v_normalized_phone := regexp_replace(v_normalized_phone, '^00212', '+212');
    v_normalized_phone := regexp_replace(v_normalized_phone, '^0', '+212');

    select count(*) into v_owner_count
    from public.owners
    where regexp_replace(
      regexp_replace(regexp_replace(coalesce(phone, ''), '[[:space:]_().-]', '', 'g'), '^00212', '+212'),
      '^0', '+212'
    ) = v_normalized_phone;

    if v_owner_count > 1 then
      raise exception 'Plusieurs proprietaires correspondent a ce telephone';
    elsif v_owner_count = 1 then
      select id into v_owner_id
      from public.owners
      where regexp_replace(
        regexp_replace(regexp_replace(coalesce(phone, ''), '[[:space:]_().-]', '', 'g'), '^00212', '+212'),
        '^0', '+212'
      ) = v_normalized_phone
      order by created_at asc, id::text asc
      limit 1;

      update public.leads
      set owner_id = v_owner_id,
          status = 'converted',
          converted_at = now()
      where id = v_lead.id;

      return v_owner_id;
    end if;
  end if;

  if v_phone is null then
    raise exception 'telephone du lead est requis';
  end if;

  if v_lead.company_id is null then
    raise exception 'aucune entreprise';
  end if;

  insert into public.owners (
    company_id, full_name, phone, email, city, country,
    preferred_contact_channel, source, status, lead_id, notes
  )
  values (
    v_lead.company_id,
    coalesce(nullif(trim(v_lead.name), ''), 'Proprietaire Yakout'),
    v_normalized_phone,
    v_email,
    'Marrakech', 'Maroc', 'whatsapp',
    coalesce(nullif(trim(v_lead.source), ''), 'Lead conversion'),
    'lead_received',
    v_lead.id,
    coalesce(nullif(trim(v_lead.message), ''), 'Cree depuis un lead proprietaire.')
  )
  returning id into v_owner_id;

  if v_owner_id is null then
    raise exception 'echec creation proprietaire';
  end if;

  update public.leads
  set owner_id = v_owner_id,
      status = 'converted',
      converted_at = now()
  where id = v_lead.id;

  return v_owner_id;
end;
$$;
