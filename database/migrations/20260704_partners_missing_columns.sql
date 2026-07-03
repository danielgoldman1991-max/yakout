-- ═══════════════════════════════════════════════
-- Migration: Partners — colonnes manquantes
-- Ajoute les colonnes étendues si elles manquent
-- ═══════════════════════════════════════════════

do $$
begin
  -- Colonnes de base étendues
  alter table public.partners add column if not exists partner_type text default 'other';
  alter table public.partners add column if not exists city text default 'Marrakech';
  alter table public.partners add column if not exists company_name text;
  alter table public.partners add column if not exists ice text;
  alter table public.partners add column if not exists tax_id text;
  alter table public.partners add column if not exists contact_person text;
  alter table public.partners add column if not exists preferred_contact_channel text default 'whatsapp';
  alter table public.partners add column if not exists status text default 'active';
  alter table public.partners add column if not exists whatsapp text;
  alter table public.partners add column if not exists address text;

  -- Services & zones
  alter table public.partners add column if not exists service_categories text[] default '{}';
  alter table public.partners add column if not exists zones text[] default '{}';
  alter table public.partners add column if not exists languages text[] default '{}';

  -- Finance
  alter table public.partners add column if not exists commission_rate numeric(5,2);
  alter table public.partners add column if not exists default_cost_type text;
  alter table public.partners add column if not exists payment_terms text;
  alter table public.partners add column if not exists bank_name text;
  alter table public.partners add column if not exists rib text;

  -- Évaluation
  alter table public.partners add column if not exists rating integer;
  alter table public.partners add column if not exists reliability_score integer;
  alter table public.partners add column if not exists internal_notes text;

  -- Migration des données existantes
  update public.partners
  set
    partner_type = coalesce(nullif(partner_type, ''), nullif(type, ''), 'other'),
    status = coalesce(nullif(status, ''), case when is_active then 'active' else 'inactive' end)
  where partner_type is null or partner_type = '' or status is null or status = '';
end;
$$;

-- Indexes
create index if not exists partners_partner_type_idx on public.partners(partner_type);
create index if not exists partners_status_idx on public.partners(status);
create index if not exists partners_city_idx on public.partners(city);
