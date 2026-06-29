-- ============================================================
-- SEED DATA â€” Yakout Conciergerie et Services
-- Usage : psql -U <user> -d <db> -f database/seed.sql
-- Toutes les donnÃ©es sont modifiables depuis le dashboard.
-- ============================================================

-- â”€â”€â”€ Company â”€â”€â”€
insert into public.companies (id, name, city)
values ('00000000-0000-0000-0000-000000000001', 'Yakout Conciergerie et Services', 'Marrakech')
on conflict (id) do nothing;

-- â”€â”€â”€ Modules â”€â”€â”€
insert into public.modules (company_id, name, status, description)
values
('00000000-0000-0000-0000-000000000001','Site web public premium','active','Presence en ligne premium'),
('00000000-0000-0000-0000-000000000001','Application interne de gestion','active','Gestion centralisee'),
('00000000-0000-0000-0000-000000000001','Back-office CMS du site','active','Gestion du contenu'),
('00000000-0000-0000-0000-000000000001','Portail Syndic','inactive','Module futur non active'),
('00000000-0000-0000-0000-000000000001','Evenementiel','inactive','Module futur non active');

-- â”€â”€â”€ Site Settings â”€â”€â”€
insert into public.site_settings (company_id, key, value, is_public)
values
('00000000-0000-0000-0000-000000000001','company_name','Yakout Conciergerie et Services',true),
('00000000-0000-0000-0000-000000000001','city','Marrakech',true),
('00000000-0000-0000-0000-000000000001','phone','+212 6 66 56 71 33',true),
('00000000-0000-0000-0000-000000000001','email','contact@yakout.ma',true),
('00000000-0000-0000-0000-000000000001','whatsapp','+212666567133',true);

-- â”€â”€â”€ Site Pages â”€â”€â”€
insert into public.site_pages (company_id, slug, title, subtitle, content, status, meta_title, meta_description)
values
('00000000-0000-0000-0000-000000000001','accueil','Yakout Conciergerie et Services','Conciergerie premium a Marrakech','Accueil dynamique administrable depuis le CMS.','published','Yakout Conciergerie Marrakech','Conciergerie, appartements et chauffeur prive a Marrakech'),
('00000000-0000-0000-0000-000000000001','about','A propos de Yakout','Une presence locale fiable','Presentation de Yakout Conciergerie et Services.','published',null,null),
('00000000-0000-0000-0000-000000000001','conciergerie-immobiliere','Conciergerie immobiliere','Confiez votre bien a Marrakech','Gestion proprietaire, accueil voyageurs et suivi operationnel.','published',null,null),
('00000000-0000-0000-0000-000000000001','chauffeur-prive','chauffeur'Skoda Kodiaq avec chauffeur','Transferts, excursions et mise a disposition.','published',null,null),
('00000000-0000-0000-0000-000000000001','services-touristiques','services','Experiences premium','Excursions, sejours et services sur mesure.','published',null,null),
('00000000-0000-0000-0000-000000000001','contact','Contact','Parlez-nous de votre besoin','Formulaire de contact general.','published',null,null);

-- â”€â”€â”€ Blog Categories â”€â”€â”€
insert into public.blog_categories (company_id, name, slug)
values
('00000000-0000-0000-0000-000000000001','Marrakech','marrakech'),
('00000000-0000-0000-0000-000000000001','Conciergerie','conciergerie'),
('00000000-0000-0000-0000-000000000001','Immobilier','immobilier'),
('00000000-0000-0000-0000-000000000001','Transport','transport'),
('00000000-0000-0000-0000-000000000001','Conseils voyageurs','conseils-voyageurs');

-- â”€â”€â”€ Blog Posts â”€â”€â”€
insert into public.blog_posts (company_id, title, slug, cover_image_url, category, excerpt, content, author, status, published_at, meta_title, meta_description)
values
('00000000-0000-0000-0000-000000000001',
 'Ou sejourner a Marrakech pour un court sejour ?',
 'ou-sejourner-marrakech-court-sejour',
 '/images/yakout/yakout-hero-terrace.png',
 'Marrakech',
 'Les meilleurs quartiers pour un sejour reussi a Marrakech : Gueliz, Hivernage, Medina et Palmeraie.',
 'Marrakech regorge de quartiers charmants. Que vous soyez voyageur d''affaires ou touriste, le choix du quartier est essentiel pour profiter pleinement de votre sejour. Gueliz, le quartier moderne, regroupe commerces et restaurants. Hivernage est plus calme et residentiel. La Medina vous plonge dans l''histoire. La Palmeraie offre un cadre luxueux.',
 'Yakout',
 'published',
 '2026-06-01',
 'Ou sejourner a Marrakech ?',
 'Les meilleurs quartiers pour un sejour a Marrakech : Gueliz, Hivernage, Medina, Palmeraie.'),

('00000000-0000-0000-0000-000000000001',
 'Pourquoi choisir un chauffeur prive a Marrakech ?',
 'chauffeur-prive-marrakech-avantages',
 '/images/yakout/yakout-transfert-aeroport.png',
 'Transport',
 'Confort, securite et ponctualite : les avantages du chauffeur prive pour vos deplacements a Marrakech.',
 'Se deplacera Marrakech peut etre complexe pour les visiteurs. Le chauffeur prive offre une solution cle en main : prise en charge a l''aeroport, trajets securises, flexibilite et confort. Avec Yakout, chaque trajet est une experience sereine.',
 'Yakout',
 'published',
 '2026-06-10',
 'Chauffeur prive Marrakech : avantages',
 'Pourquoi choisir un chauffeur prive a Marrakech ? Confort, securite et ponctualite.'),

('00000000-0000-0000-0000-000000000001',
 'Comment rentabiliser son appartement en location courte duree ?',
 'rentabiliser-appartement-location-courte-duree-marrakech',
 '/images/yakout/yakout-conciergerie-proprietaire.png',
 'Immobilier',
 'Nos conseils pour optimiser la rentabilite de votre bien a Marrakech grace a une gestion professionnelle.',
 'La location courte duree a Marrakech est un marche porteur. Pour maximiser vos revenus, il est essentiel de soigner la presentation de votre bien, d''optimiser vos tarifs selon la saison et de proposer un service irreprochable aux voyageurs. Yakout vous accompagne dans chaque etape.',
 'Yakout',
 'published',
 '2026-06-15',
 'Rentabiliser son appartement a Marrakech',
 'Conseils pour optimiser la rentabilite de votre appartement en location courte duree a Marrakech.');

-- â”€â”€â”€ Services â”€â”€â”€
insert into public.services (company_id, title, slug, short_description, description, image_url, price_from, is_published, display_order)
values
('00000000-0000-0000-0000-000000000001',
 'Location d''appartements a Marrakech',
 'location-appartements-marrakech',
 'Des appartements selectionnes pour des sejours confortables et bien organises.',
 'Selection et gestion de courts sejours dans les meilleurs quartiers de Marrakech.',
 '/images/yakout/yakout-appartement-premium.png', 700, true, 1),

('00000000-0000-0000-0000-000000000001',
 'Conciergerie proprietaire',
 'conciergerie-proprietaire-marrakech',
 'Une gestion locale pour valoriser votre bien et suivre votre activite.',
 'Confier son bien a Yakout pour une gestion professionnelle et un suivi transparent.',
 '/images/yakout/yakout-conciergerie-proprietaire.png', null, true, 2),

('00000000-0000-0000-0000-000000000001',
 'chauffeur',
 'chauffeur-prive-marrakech',
 'Transferts, trajets prives et excursions avec chauffeur.',
 'Skoda Kodiaq avec chauffeur professionnel pour tous vos deplacements.',
 '/images/yakout/yakout-skoda-chauffeur.png', 300, true, 3),

('00000000-0000-0000-0000-000000000001',
 'Transfert aeroport Marrakech',
 'transfert-aeroport-marrakech',
 'Un service ponctuel et confortable des votre arrivee a Marrakech.',
 'Accueil aeroport Marrakech Menara et transfert vers votre hebergement.',
 '/images/yakout/yakout-transfert-aeroport.png', 250, true, 4),

('00000000-0000-0000-0000-000000000001',
 'Vehicules partenaires',
 'vehicules-partenaires-marrakech',
 'Des solutions de mobilite adaptees selon le besoin et le nombre de voyageurs.',
 'Vehicules avec chauffeurs partenaires selectionnes pour leur fiabilite.',
 '/images/yakout/yakout-skoda-chauffeur.png', 400, true, 5),

('00000000-0000-0000-0000-000000000001',
 'services',
 'services-touristiques',
 'Excursions et experiences premium autour de Marrakech.',
 'Circuits personnalises, activites et decouvertes sur mesure.',
 '/images/yakout/yakout-hero-terrace.png', 500, true, 6);

-- â”€â”€â”€ Clients â”€â”€â”€
insert into public.clients (id, company_id, full_name, phone, email, nationality, acquisition_source)
values
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Sarah Martin', '+33 6 12 34 56 78', 'sarah@example.com', 'Francaise', 'Site web'),
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Thomas Wagner', '+49 170 1234567', 'thomas@example.com', 'Allemande', 'Google'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Youssef Amrani', '+212 6 11 22 33 44', null, 'Marocaine', 'WhatsApp'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Fatima Benali', '+212 6 55 44 33 22', null, 'Marocaine', 'Site web');

-- â”€â”€â”€ Leads (matching form request_type values) â”€â”€â”€
insert into public.leads (company_id, name, phone, email, request_type, source, message, desired_date, people_count, estimated_budget, status)
values
('00000000-0000-0000-0000-000000000001', 'Sarah Martin', '+33 6 12 34 56 78', 'sarah@example.com', 'reservation', 'Site web', 'Recherche appartement 2 chambres pour juillet.', '2026-07-12', 4, 9000, 'new'),
('00000000-0000-0000-0000-000000000001', 'Youssef Amrani', '+212 6 11 22 33 44', null, 'chauffeur', 'WhatsApp', 'Transfert aeroport et excursion Agafay.', null, null, null, 'Contacte'),
('00000000-0000-0000-0000-000000000001', 'Pierre Dubois', '+33 7 98 76 54 32', 'pierre@example.com', 'proprietaire', 'Site web', 'Je souhaite confier mon appartement a Gueliz.', '2026-07-01', null, null, 'A qualifier'),
('00000000-0000-0000-0000-000000000001', 'Emma Fischer', '+49 176 98765432', 'emma@example.com', 'chauffeur', 'Google', 'Transfert aeroport Menara vers Palmeraie le 15 juillet.', '2026-07-15', 2, 350, 'Devis envoye'),
('00000000-0000-0000-0000-000000000001', 'Mehdi Alaoui', '+212 6 77 88 99 00', 'mehdi@example.com', 'vehicule', 'Site web', 'Besoin d un vehicule pour mariage le 20 aout.', '2026-08-20', 8, 2500, 'new'),
('00000000-0000-0000-0000-000000000001', 'Claire Bernard', '+33 6 99 88 77 66', 'claire@example.com', 'services', 'Site web', 'Excursion a Agafay pour 4 personnes.', '2026-07-22', 4, 2000, 'A qualifier'),
('00000000-0000-0000-0000-000000000001', 'John Smith', '+1 415 555 0123', 'john@example.com', 'general', 'Google', 'Informations sur vos services de conciergerie.', null, null, null, 'new');

-- â”€â”€â”€ Appartements â”€â”€â”€
insert into public.apartments (company_id, internal_name, public_name, slug, district, public_district, bedrooms, capacity, price_from, short_description, image_url, image_alt_text, is_published, is_featured)
values
('00000000-0000-0000-0000-000000000001',
 'Majorelle Signature',
 'Appartement Majorelle Signature',
 'appartement-majorelle-signature',
 'Majorelle', 'Majorelle',
 2, 4, 950,
 'Appartement elegant proche du Jardin Majorelle, pense pour les sejours confortables a Marrakech avec salon lumineux et decoration chaleureuse.',
 '/images/yakout/apartments/majorelle-signature.png',
 'Appartement Majorelle Signature a Marrakech',
 true, true),

('00000000-0000-0000-0000-000000000001',
 'Suite Urbaine Gueliz',
 'Suite Urbaine Gueliz',
 'suite-urbaine-gueliz',
 'Gueliz', 'Gueliz',
 1, 2, 650,
 'Adresse pratique et raffinee au coeur de Gueliz, ideale pour un court sejour, un deplacement professionnel ou une escapade a deux.',
 '/images/yakout/apartments/suite-urbaine-gueliz.png',
 'Suite Urbaine Gueliz a Marrakech',
 true, false),

('00000000-0000-0000-0000-000000000001',
 'Hivernage Elegance',
 'Appartement Hivernage Elegance',
 'appartement-hivernage-elegance',
 'Hivernage', 'Hivernage',
 2, 4, 1200,
 'Appartement premium dans l''un des quartiers les plus recherches de Marrakech, proche des hotels, restaurants et lieux de sortie.',
 '/images/yakout/apartments/hivernage-elegance.png',
 'Appartement Hivernage Elegance a Marrakech',
 true, true),

('00000000-0000-0000-0000-000000000001',
 'Penthouse Terrasse M Avenue',
 'Penthouse Terrasse M Avenue',
 'penthouse-terrasse-m-avenue',
 'M Avenue', 'M Avenue',
 2, 5, 1600,
 'Penthouse contemporain avec terrasse, ideal pour profiter de la lumiere de Marrakech dans une ambiance moderne et exclusive.',
 '/images/yakout/apartments/penthouse-m-avenue.png',
 'Penthouse Terrasse M Avenue a Marrakech',
 true, true),

('00000000-0000-0000-0000-000000000001',
 'Riad Medina',
 'Appartement Riad Medina',
 'appartement-riad-medina',
 'Medina', 'Medina',
 1, 3, 750,
 'Appartement au charme marocain, inspire de l''esprit riad, parfait pour vivre Marrakech de maniere authentique tout en gardant le confort moderne.',
 '/images/yakout/apartments/riad-medina.png',
 'Appartement Riad Medina a Marrakech',
 true, false),

('00000000-0000-0000-0000-000000000001',
 'Palmeraie Prestige',
 'Residence Palmeraie Prestige',
 'residence-palmeraie-prestige',
 'Palmeraie', 'Palmeraie',
 3, 6, 1800,
 'Bien spacieux dans un environnement calme, adapte aux familles et voyageurs recherchant serenite, confort et service accompagne.',
 '/images/yakout/apartments/palmeraie-prestige.png',
 'Residence Palmeraie Prestige a Marrakech',
 true, true),

('00000000-0000-0000-0000-000000000001',
 'Agdal Moderne',
 'Appartement Moderne Agdal',
 'appartement-moderne-agdal',
 'Agdal', 'Agdal',
 2, 4, 900,
 'Appartement moderne proche des axes principaux, pratique pour les sejours en famille ou entre amis avec acces facile aux restaurants et commerces.',
 '/images/yakout/apartments/moderne-agdal.png',
 'Appartement Moderne Agdal a Marrakech',
 true, false),

('00000000-0000-0000-0000-000000000001',
 'Victor Hugo Business',
 'Business Flat Victor Hugo',
 'business-flat-victor-hugo',
 'Victor Hugo', 'Victor Hugo',
 1, 2, 700,
 'Appartement fonctionnel et elegant, pense pour les voyageurs business qui veulent rester proches du centre de Marrakech.',
 '/images/yakout/apartments/business-flat-victor-hugo.png',
 'Business Flat Victor Hugo a Marrakech',
 true, false),

('00000000-0000-0000-0000-000000000001',
 'Ourika View',
 'Terrasse Ourika View',
 'terrasse-ourika-view',
 'Route de l''Ourika', 'Route de l''Ourika',
 2, 4, 1050,
 'Adresse paisible avec terrasse, ideale pour un sejour entre ville, nature et departs vers les excursions autour de Marrakech.',
 '/images/yakout/apartments/terrasse-ourika-view.png',
 'Terrasse Ourika View a Marrakech',
 true, true),

('00000000-0000-0000-0000-000000000001',
 'Targa Confort',
 'Appartement Confort Targa',
 'appartement-confort-targa',
 'Targa', 'Targa',
 2, 5, 850,
 'Appartement confortable dans un quartier residentiel calme, adapte aux familles, sejours moyens et voyageurs recherchant plus d''espace.',
 '/images/yakout/apartments/confort-targa.png',
 'Appartement Confort Targa a Marrakech',
 true, false);

-- â”€â”€â”€ VÃ©hicules â”€â”€â”€
insert into public.vehicles (company_id, internal_name, vehicle_type, brand, model, capacity, public_name, slug, public_description, price_from, with_driver, image_url, image_alt_text, is_published, is_featured)
values
('00000000-0000-0000-0000-000000000001',
 'Skoda Kodiaq Executive', 'Vehicule Yakout', 'Skoda', 'Kodiaq', 6,
 'Skoda Kodiaq Executive', 'skoda-kodiaq-executive',
 'SUV confortable avec chauffeur prive, ideal pour transferts aeroport, trajets en ville et deplacements familiaux a Marrakech.',
 350, true, '/images/yakout/vehicles/skoda-kodiaq-executive.png', 'Skoda Kodiaq Executive a Marrakech', true, true),

('00000000-0000-0000-0000-000000000001',
 'Mercedes Classe V Premium', 'Vehicule Yakout', 'Mercedes-Benz', 'Classe V', 7,
 'Mercedes Classe V Premium', 'mercedes-classe-v-premium',
 'Van premium pour familles, groupes et transferts VIP, avec espace genereux et confort haut de gamme.',
 800, true, '/images/yakout/vehicles/mercedes-classe-v-premium.png', 'Mercedes Classe V Premium a Marrakech', true, true),

('00000000-0000-0000-0000-000000000001',
 'Hyundai H1 Confort', 'Vehicule Yakout', 'Hyundai', 'H1', 8,
 'Hyundai H1 Confort', 'hyundai-h1-confort',
 'Vehicule spacieux pour groupes, transferts aeroport et excursions autour de Marrakech.',
 650, true, '/images/yakout/vehicles/hyundai-h1-confort.png', 'Hyundai H1 Confort a Marrakech', true, false),

('00000000-0000-0000-0000-000000000001',
 'Dacia Lodgy Family', 'Vehicule Yakout', 'Dacia', 'Lodgy', 6,
 'Dacia Lodgy Family', 'dacia-lodgy-family',
 'Solution familiale simple et confortable pour les trajets prives et transferts economiques.',
 300, true, '/images/yakout/vehicles/dacia-lodgy-family.png', 'Dacia Lodgy Family a Marrakech', true, false),

('00000000-0000-0000-0000-000000000001',
 'Toyota Prado Prestige', 'Vehicule Yakout', 'Toyota', 'Prado', 6,
 'Toyota Prado Prestige', 'toyota-prado-prestige',
 'SUV premium adapte aux excursions, trajets prives et deplacements confortables hors centre-ville.',
 900, true, '/images/yakout/vehicles/toyota-prado-prestige.png', 'Toyota Prado Prestige a Marrakech', true, true),

('00000000-0000-0000-0000-000000000001',
 'Range Rover Vogue Partner', 'vehicule', 'Range Rover', 'Vogue', 4,
 'Range Rover Vogue Partner', 'range-rover-vogue-partner',
 'Vehicule partenaire haut de gamme pour demandes premium, evenements prives et deplacements exclusifs.',
 1500, true, '/images/yakout/vehicles/range-rover-vogue-partner.png', 'Range Rover Vogue Partner a Marrakech', true, true),

('00000000-0000-0000-0000-000000000001',
 'Mercedes Classe E Executive', 'Vehicule Yakout', 'Mercedes-Benz', 'Classe E', 3,
 'Mercedes Classe E Executive', 'mercedes-classe-e-executive',
 'Berline executive pour rendez-vous, transferts discrets et deplacements professionnels.',
 700, true, '/images/yakout/vehicles/mercedes-classe-e-executive.png', 'Mercedes Classe E Executive a Marrakech', true, false),

('00000000-0000-0000-0000-000000000001',
 'Mercedes Sprinter Groupe', 'vehicule', 'Mercedes-Benz', 'Sprinter', 15,
 'Mercedes Sprinter Groupe', 'mercedes-sprinter-groupe',
 'Minibus adapte aux groupes, seminaires, familles nombreuses et excursions organisees.',
 1200, true, '/images/yakout/vehicles/mercedes-sprinter-groupe.png', 'Mercedes Sprinter Groupe a Marrakech', true, false),

('00000000-0000-0000-0000-000000000001',
 'Renault Trafic Private Van', 'Vehicule Yakout', 'Renault', 'Trafic', 8,
 'Renault Trafic Private Van', 'renault-trafic-private-van',
 'Van prive confortable pour transferts, circuits courts et deplacements de groupe a Marrakech.',
 600, true, '/images/yakout/vehicles/renault-trafic-private-van.png', 'Renault Trafic Private Van a Marrakech', true, false),

('00000000-0000-0000-0000-000000000001',
 'Toyota Land Cruiser Excursion', 'Vehicule Yakout', 'Toyota', 'Land Cruiser', 6,
 'Toyota Land Cruiser Excursion', 'toyota-land-cruiser-excursion',
 '4x4 robuste et confortable pour excursions vers Agafay, Ourika, Ouarzazate ou les environs de Marrakech.',
 1100, true, '/images/yakout/vehicles/toyota-land-cruiser-excursion.png', 'Toyota Land Cruiser Excursion a Marrakech', true, true);

-- â”€â”€â”€ RÃ©servations â”€â”€â”€
insert into public.reservations (company_id, client_id, apartment_id, check_in, check_out, people_count, total_amount, deposit_amount, reservation_status)
values
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', (select id from public.apartments where slug = 'appartement-majorelle-signature'), '2026-07-12', '2026-07-18', 4, 5700, 2000, 'Confirmee'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000013', (select id from public.apartments where slug = 'appartement-hivernage-elegance'), '2026-08-01', '2026-08-10', 5, 10800, 0, 'Pre-reservation');

-- â”€â”€â”€ Trajets â”€â”€â”€
insert into public.trips (company_id, client_id, vehicle_id, trip_date, trip_time, departure, destination, trip_type, sold_price, cost_price, trip_status)
values
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', (select id from public.vehicles where slug = 'skoda-kodiaq-executive'), '2026-07-01', '14:00', 'Aeroport Marrakech Menara', 'Hivernage', 'Transfert', 350, 120, 'Confirme'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', (select id from public.vehicles where slug = 'skoda-kodiaq-executive'), '2026-07-05', '09:00', 'Hivernage', 'Agafay', 'Excursion', 800, 250, 'Confirme');

-- â”€â”€â”€ Paiements â”€â”€â”€
insert into public.payments (company_id, client_id, reservation_id, amount, paid_at, payment_method, activity_type, status)
values
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', (select id from public.reservations where check_in = '2026-07-12' limit 1), 2000, '2026-06-26', 'Virement', 'Appartement', 'Paye'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', null, 800, '2026-06-28', 'Especes', 'Transport', 'Paye');

-- â”€â”€â”€ DÃ©penses â”€â”€â”€
insert into public.expenses (company_id, expense_date, amount, category, activity_type, notes)
values
('00000000-0000-0000-0000-000000000001', '2026-06-27', 450, 'Menage', 'Appartement', 'Menage appartement Majorelle Signature'),
('00000000-0000-0000-0000-000000000001', '2026-06-28', 200, 'Fournitures', 'Appartement', 'Linge de maison et consommables'),
('00000000-0000-0000-0000-000000000001', '2026-06-29', 120, 'Carburant', 'Transport', 'Carburant Skoda Kodiaq'),
('00000000-0000-0000-0000-000000000001', '2026-06-30', 300, 'Commission partenaire', 'Transport', 'Commission partenaire excursion Agafay');

