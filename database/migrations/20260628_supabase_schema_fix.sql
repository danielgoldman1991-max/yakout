-- ============================================================
-- Migration: Add missing columns + fix leads constraint
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add missing columns to apartments
alter table public.apartments
  add column if not exists image_url text,
  add column if not exists image_alt_text text,
  add column if not exists bathrooms integer default 0,
  add column if not exists proprietor_partner_id uuid references public.partners(id) on delete set null;

-- 2. Drop old column if it exists (our schema uses proprietor_partner_id)
alter table public.apartments drop column if exists owner_partner_id;

-- 3. Add missing columns to vehicles
alter table public.vehicles
  add column if not exists image_url text,
  add column if not exists image_alt_text text;

-- 4. Drop restrictive leads CHECK constraint (form uses human-readable values)
alter table public.leads
  drop constraint if exists leads_request_type_check;

-- 5. Update existing leads with image_url
update public.apartments set image_url = '/images/yakout/apartments/majorelle-signature.png', image_alt_text = 'Appartement Majorelle Signature' where slug = 'appartement-majorelle-signature';
update public.apartments set image_url = '/images/yakout/apartments/suite-urbaine-gueliz.png', image_alt_text = 'Suite Urbaine Gueliz' where slug = 'suite-urbaine-gueliz';
update public.apartments set image_url = '/images/yakout/apartments/hivernage-elegance.png', image_alt_text = 'Appartement Hivernage Elegance' where slug = 'appartement-hivernage-elegance';
update public.apartments set image_url = '/images/yakout/apartments/penthouse-m-avenue.png', image_alt_text = 'Penthouse Terrasse M Avenue' where slug = 'penthouse-terrasse-m-avenue';
update public.apartments set image_url = '/images/yakout/apartments/riad-medina.png', image_alt_text = 'Appartement Riad Medina' where slug = 'appartement-riad-medina';
update public.apartments set image_url = '/images/yakout/apartments/palmeraie-prestige.png', image_alt_text = 'Residence Palmeraie Prestige' where slug = 'residence-palmeraie-prestige';
update public.apartments set image_url = '/images/yakout/apartments/moderne-agdal.png', image_alt_text = 'Appartement Moderne Agdal' where slug = 'appartement-moderne-agdal';
update public.apartments set image_url = '/images/yakout/apartments/business-flat-victor-hugo.png', image_alt_text = 'Business Flat Victor Hugo' where slug = 'business-flat-victor-hugo';
update public.apartments set image_url = '/images/yakout/apartments/terrasse-ourika-view.png', image_alt_text = 'Terrasse Ourika View' where slug = 'terrasse-ourika-view';
update public.apartments set image_url = '/images/yakout/apartments/confort-targa.png', image_alt_text = 'Appartement Confort Targa' where slug = 'appartement-confort-targa';

update public.vehicles set image_url = '/images/yakout/vehicles/skoda-kodiaq-executive.png', image_alt_text = 'Skoda Kodiaq Executive' where slug = 'skoda-kodiaq-executive';
update public.vehicles set image_url = '/images/yakout/vehicles/mercedes-classe-v-premium.png', image_alt_text = 'Mercedes Classe V Premium' where slug = 'mercedes-classe-v-premium';
update public.vehicles set image_url = '/images/yakout/vehicles/hyundai-h1-confort.png', image_alt_text = 'Hyundai H1 Confort' where slug = 'hyundai-h1-confort';
update public.vehicles set image_url = '/images/yakout/vehicles/dacia-lodgy-family.png', image_alt_text = 'Dacia Lodgy Family' where slug = 'dacia-lodgy-family';
update public.vehicles set image_url = '/images/yakout/vehicles/toyota-prado-prestige.png', image_alt_text = 'Toyota Prado Prestige' where slug = 'toyota-prado-prestige';
update public.vehicles set image_url = '/images/yakout/vehicles/range-rover-vogue-partner.png', image_alt_text = 'Range Rover Vogue Partner' where slug = 'range-rover-vogue-partner';
update public.vehicles set image_url = '/images/yakout/vehicles/mercedes-classe-e-executive.png', image_alt_text = 'Mercedes Classe E Executive' where slug = 'mercedes-classe-e-executive';
update public.vehicles set image_url = '/images/yakout/vehicles/mercedes-sprinter-groupe.png', image_alt_text = 'Mercedes Sprinter Groupe' where slug = 'mercedes-sprinter-groupe';
update public.vehicles set image_url = '/images/yakout/vehicles/renault-trafic-private-van.png', image_alt_text = 'Renault Trafic Private Van' where slug = 'renault-trafic-private-van';
update public.vehicles set image_url = '/images/yakout/vehicles/toyota-land-cruiser-excursion.png', image_alt_text = 'Toyota Land Cruiser Excursion' where slug = 'toyota-land-cruiser-excursion';
