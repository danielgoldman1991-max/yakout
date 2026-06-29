-- ============================================================
-- Fix leads request_type constraint + add image_url to seed data
-- Yakout Conciergerie et Services
-- Idempotent — safe to re-run
-- ============================================================

-- ─── 1. Relax leads.request_type constraint ───
-- The form submits human-readable values (e.g. "Confier mon bien")
-- Drop the restrictive CHECK, keep validation at app layer (Zod)
alter table public.leads
  drop constraint if exists leads_request_type_check;

-- ─── 2. Add image_url to existing apartments ───
update public.apartments set image_url = '/images/yakout/apartments/majorelle-signature.png' where slug = 'appartement-majorelle-signature' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/suite-urbaine-gueliz.png' where slug = 'suite-urbaine-gueliz' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/hivernage-elegance.png' where slug = 'appartement-hivernage-elegance' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/penthouse-m-avenue.png' where slug = 'penthouse-terrasse-m-avenue' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/riad-medina.png' where slug = 'appartement-riad-medina' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/palmeraie-prestige.png' where slug = 'residence-palmeraie-prestige' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/moderne-agdal.png' where slug = 'appartement-moderne-agdal' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/business-flat-victor-hugo.png' where slug = 'business-flat-victor-hugo' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/terrasse-ourika-view.png' where slug = 'terrasse-ourika-view' and image_url is null;
update public.apartments set image_url = '/images/yakout/apartments/confort-targa.png' where slug = 'appartement-confort-targa' and image_url is null;

-- ─── 3. Add image_url to existing vehicles ───
update public.vehicles set image_url = '/images/yakout/vehicles/skoda-kodiaq-executive.png' where slug = 'skoda-kodiaq-executive' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/mercedes-classe-v-premium.png' where slug = 'mercedes-classe-v-premium' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/hyundai-h1-confort.png' where slug = 'hyundai-h1-confort' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/dacia-lodgy-family.png' where slug = 'dacia-lodgy-family' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/toyota-prado-prestige.png' where slug = 'toyota-prado-prestige' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/range-rover-vogue-partner.png' where slug = 'range-rover-vogue-partner' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/mercedes-classe-e-executive.png' where slug = 'mercedes-classe-e-executive' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/mercedes-sprinter-groupe.png' where slug = 'mercedes-sprinter-groupe' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/renault-trafic-private-van.png' where slug = 'renault-trafic-private-van' and image_url is null;
update public.vehicles set image_url = '/images/yakout/vehicles/toyota-land-cruiser-excursion.png' where slug = 'toyota-land-cruiser-excursion' and image_url is null;

-- ─── 4. Add default site_settings ───
insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'company_name', 'Yakout Conciergerie et Services', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'company_name');

insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'phone', '+212 6 66 56 71 33', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'phone');

insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'email', 'contact@yakout.ma', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'email');

insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'whatsapp', '+212666567133', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'whatsapp');

insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'address', 'Marrakech, Maroc', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'address');

insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'city', 'Marrakech', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'city');

insert into public.site_settings (company_id, key, value, is_public)
select c.id, 'currency', 'MAD', true
from public.companies c
where not exists (select 1 from public.site_settings s where s.company_id = c.id and s.key = 'currency');

-- ─── 5. Add default SEO metadata ───
insert into public.seo_metadata (company_id, page_type, slug, meta_title, meta_description)
select c.id, 'home', 'accueil', 'Yakout Conciergerie Marrakech', 'Conciergerie, appartements, chauffeur privé et services premium à Marrakech.'
from public.companies c
where not exists (select 1 from public.seo_metadata s where s.company_id = c.id and s.slug = 'accueil');

-- ─── 6. Blog categories (idempotent) ───
insert into public.blog_categories (company_id, name, slug)
select c.id, name, slug
from public.companies c
cross join (values
  ('Marrakech', 'marrakech'),
  ('Conciergerie', 'conciergerie'),
  ('Immobilier', 'immobilier'),
  ('Transport', 'transport'),
  ('Conseils voyageurs', 'conseils-voyageurs')
) as cats(name, slug)
where not exists (select 1 from public.blog_categories b where b.company_id = c.id and b.slug = cats.slug);
