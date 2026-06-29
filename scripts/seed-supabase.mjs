// Seed Supabase with all starter data using service_role key
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const COMPANY = '00000000-0000-0000-0000-000000000001';
const CLIENTS = {
  SARAH: '00000000-0000-0000-0000-000000000010',
  THOMAS: '00000000-0000-0000-0000-000000000011',
  YOUSSEF: '00000000-0000-0000-0000-000000000012',
  FATIMA: '00000000-0000-0000-0000-000000000013',
};

async function seed() {
  // ─── Company ───
  const { error: e0 } = await supabase.from('companies').upsert(
    { id: COMPANY, name: 'Yakout Conciergerie et Services', city: 'Marrakech' },
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (e0) { console.error('companies:', e0.message); return; }
  console.log('✓ company');

  // ─── Modules ───
  const { error: e1 } = await supabase.from('modules').upsert([
    { company_id: COMPANY, name: 'Site web public premium', status: 'active', description: 'Presence en ligne premium' },
    { company_id: COMPANY, name: 'Application interne de gestion', status: 'active', description: 'Gestion centralisee' },
    { company_id: COMPANY, name: 'Back-office CMS du site', status: 'active', description: 'Gestion du contenu' },
    { company_id: COMPANY, name: 'Portail Syndic', status: 'inactive', description: 'Module futur non active' },
    { company_id: COMPANY, name: 'Evenementiel', status: 'inactive', description: 'Module futur non active' },
  ], { onConflict: 'id', ignoreDuplicates: true });
  if (e1) console.error('modules:', e1.message); else console.log('✓ modules');

  // ─── Site Settings ───
  const settings = [
    { company_id: COMPANY, key: 'company_name', value: 'Yakout Conciergerie et Services', is_public: true },
    { company_id: COMPANY, key: 'city', value: 'Marrakech', is_public: true },
    { company_id: COMPANY, key: 'phone', value: '+212 6 66 56 71 33', is_public: true },
    { company_id: COMPANY, key: 'email', value: 'contact@yakout.ma', is_public: true },
    { company_id: COMPANY, key: 'whatsapp', value: '+212666567133', is_public: true },
    { company_id: COMPANY, key: 'currency', value: 'MAD', is_public: true },
  ];
  for (const s of settings) {
    const { error } = await supabase.from('site_settings').upsert(s, { onConflict: 'id', ignoreDuplicates: true });
    if (error && !error.message.includes('duplicate key')) console.error('site_settings:', error.message);
  }
  console.log('✓ site_settings');

  // ─── Site Pages ───
  const pages = [
    { company_id: COMPANY, slug: 'accueil', title: 'Yakout Conciergerie et Services', subtitle: 'Conciergerie premium a Marrakech', status: 'published', meta_title: 'Yakout Conciergerie Marrakech', meta_description: 'Conciergerie, appartements et chauffeur prive a Marrakech' },
    { company_id: COMPANY, slug: 'about', title: 'A propos de Yakout', subtitle: 'Une presence locale fiable', status: 'published' },
    { company_id: COMPANY, slug: 'conciergerie-immobiliere', title: 'Conciergerie immobiliere', subtitle: 'Confiez votre bien a Marrakech', status: 'published' },
    { company_id: COMPANY, slug: 'chauffeur-prive', title: 'Chauffeur prive', subtitle: 'Skoda Kodiaq avec chauffeur', status: 'published' },
    { company_id: COMPANY, slug: 'services-touristiques', title: 'Services touristiques', subtitle: 'Experiences premium', status: 'published' },
    { company_id: COMPANY, slug: 'contact', title: 'Contact', subtitle: 'Parlez-nous de votre besoin', status: 'published' },
  ];
  for (const p of pages) {
    const { error } = await supabase.from('site_pages').upsert(p, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) console.error('site_pages:', error.message);
  }
  console.log('✓ site_pages');

  // ─── Blog Categories ───
  const cats = ['Marrakech', 'Conciergerie', 'Immobilier', 'Transport', 'Conseils voyageurs'];
  for (const name of cats) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const { error } = await supabase.from('blog_categories').upsert(
      { company_id: COMPANY, name, slug },
      { onConflict: 'id', ignoreDuplicates: true }
    );
    if (error && !error.message.includes('duplicate key')) console.error('blog_categories:', error.message);
  }
  console.log('✓ blog_categories');

  // ─── Blog Posts ───
  const posts = [
    { company_id: COMPANY, title: 'Ou sejourner a Marrakech pour un court sejour ?', slug: 'ou-sejourner-marrakech-court-sejour', cover_image_url: '/images/yakout/yakout-hero-terrace.png', category: 'Marrakech', excerpt: 'Les meilleurs quartiers pour un sejour reussi a Marrakech : Gueliz, Hivernage, Medina et Palmeraie.', content: 'Marrakech regorge de quartiers charmants. Que vous soyez voyageur d affaires ou touriste, le choix du quartier est essentiel pour profiter pleinement de votre sejour. Gueliz, le quartier moderne, regroupe commerces et restaurants. Hivernage est plus calme et residentiel. La Medina vous plonge dans l histoire. La Palmeraie offre un cadre luxueux.', author: 'Yakout', status: 'published', published_at: '2026-06-01T00:00:00Z', meta_title: 'Ou sejourner a Marrakech ?', meta_description: 'Les meilleurs quartiers pour un sejour a Marrakech : Gueliz, Hivernage, Medina, Palmeraie.' },
    { company_id: COMPANY, title: 'Pourquoi choisir un chauffeur prive a Marrakech ?', slug: 'chauffeur-prive-marrakech-avantages', cover_image_url: '/images/yakout/yakout-transfert-aeroport.png', category: 'Transport', excerpt: 'Confort, securite et ponctualite : les avantages du chauffeur prive pour vos deplacements a Marrakech.', content: 'Se deplacera Marrakech peut etre complexe pour les visiteurs. Le chauffeur prive offre une solution cle en main : prise en charge a l aeroport, trajets securises, flexibilite et confort. Avec Yakout, chaque trajet est une experience sereine.', author: 'Yakout', status: 'published', published_at: '2026-06-10T00:00:00Z', meta_title: 'Chauffeur prive Marrakech : avantages', meta_description: 'Pourquoi choisir un chauffeur prive a Marrakech ? Confort, securite et ponctualite.' },
    { company_id: COMPANY, title: 'Comment rentabiliser son appartement en location courte duree ?', slug: 'rentabiliser-appartement-location-courte-duree-marrakech', cover_image_url: '/images/yakout/yakout-conciergerie-proprietaire.png', category: 'Immobilier', excerpt: 'Nos conseils pour optimiser la rentabilite de votre bien a Marrakech grace a une gestion professionnelle.', content: 'La location courte duree a Marrakech est un marche porteur. Pour maximiser vos revenus, il est essentiel de soigner la presentation de votre bien, d optimiser vos tarifs selon la saison et de proposer un service irreprochable aux voyageurs. Yakout vous accompagne dans chaque etape.', author: 'Yakout', status: 'published', published_at: '2026-06-15T00:00:00Z', meta_title: 'Rentabiliser son appartement a Marrakech', meta_description: 'Conseils pour optimiser la rentabilite de votre appartement en location courte duree a Marrakech.' },
  ];
  for (const p of posts) {
    const { error } = await supabase.from('blog_posts').upsert(p, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) console.error('blog_posts:', error.message);
  }
  console.log('✓ blog_posts');

  // ─── Services ───
  const services = [
    { company_id: COMPANY, title: "Location d'appartements a Marrakech", slug: 'location-appartements-marrakech', short_description: 'Des appartements selectionnes pour des sejours confortables et bien organises.', description: 'Selection et gestion de courts sejours dans les meilleurs quartiers de Marrakech.', image_url: '/images/yakout/yakout-appartement-premium.png', price_from: 700, is_published: true, display_order: 1 },
    { company_id: COMPANY, title: 'Conciergerie proprietaire', slug: 'conciergerie-proprietaire-marrakech', short_description: 'Une gestion locale pour valoriser votre bien et suivre votre activite.', description: 'Confier son bien a Yakout pour une gestion professionnelle et un suivi transparent.', image_url: '/images/yakout/yakout-conciergerie-proprietaire.png', is_published: true, display_order: 2 },
    { company_id: COMPANY, title: 'Chauffeur prive', slug: 'chauffeur-prive-marrakech', short_description: 'Transferts, trajets prives et excursions avec chauffeur.', description: 'Skoda Kodiaq avec chauffeur professionnel pour tous vos deplacements.', image_url: '/images/yakout/yakout-skoda-chauffeur.png', price_from: 300, is_published: true, display_order: 3 },
    { company_id: COMPANY, title: 'Transfert aeroport Marrakech', slug: 'transfert-aeroport-marrakech', short_description: 'Un service ponctuel et confortable des votre arrivee a Marrakech.', description: 'Accueil aeroport Marrakech Menara et transfert vers votre hebergement.', image_url: '/images/yakout/yakout-transfert-aeroport.png', price_from: 250, is_published: true, display_order: 4 },
    { company_id: COMPANY, title: 'Vehicules partenaires', slug: 'vehicules-partenaires-marrakech', short_description: 'Des solutions de mobilite adaptees selon le besoin et le nombre de voyageurs.', description: 'Vehicules avec chauffeurs partenaires selectionnes pour leur fiabilite.', image_url: '/images/yakout/yakout-skoda-chauffeur.png', price_from: 400, is_published: true, display_order: 5 },
    { company_id: COMPANY, title: 'Services touristiques', slug: 'services-touristiques', short_description: 'Excursions et experiences premium autour de Marrakech.', description: 'Circuits personnalises, activites et decouvertes sur mesure.', image_url: '/images/yakout/yakout-hero-terrace.png', price_from: 500, is_published: true, display_order: 6 },
  ];
  for (const s of services) {
    const { error } = await supabase.from('services').upsert(s, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) console.error('services:', error.message);
  }
  console.log('✓ services');

  // ─── Clients ───
  const clients = [
    { id: CLIENTS.SARAH, company_id: COMPANY, full_name: 'Sarah Martin', phone: '+33 6 12 34 56 78', email: 'sarah@example.com', nationality: 'Francaise', acquisition_source: 'Site web' },
    { id: CLIENTS.THOMAS, company_id: COMPANY, full_name: 'Thomas Wagner', phone: '+49 170 1234567', email: 'thomas@example.com', nationality: 'Allemande', acquisition_source: 'Google' },
    { id: CLIENTS.YOUSSEF, company_id: COMPANY, full_name: 'Youssef Amrani', phone: '+212 6 11 22 33 44', email: null, nationality: 'Marocaine', acquisition_source: 'WhatsApp' },
    { id: CLIENTS.FATIMA, company_id: COMPANY, full_name: 'Fatima Benali', phone: '+212 6 55 44 33 22', email: null, nationality: 'Marocaine', acquisition_source: 'Site web' },
  ];
  for (const c of clients) {
    const { error } = await supabase.from('clients').upsert(c, { onConflict: 'id', ignoreDuplicates: true });
    if (error) console.error('clients:', error.message);
  }
  console.log('✓ clients');

  // ─── Leads (using old CHECK-compatible values; migration SQL will drop constraint) ───
  const leads = [
    { company_id: COMPANY, name: 'Sarah Martin', phone: '+33 6 12 34 56 78', email: 'sarah@example.com', request_type: 'Appartement', source: 'Site web', message: 'Recherche appartement 2 chambres pour juillet.', desired_date: '2026-07-12', people_count: 4, estimated_budget: 9000, status: 'Nouveau' },
    { company_id: COMPANY, name: 'Youssef Amrani', phone: '+212 6 11 22 33 44', email: null, request_type: 'Chauffeur prive', source: 'WhatsApp', message: 'Transfert aeroport et excursion Agafay.', status: 'Contacte' },
    { company_id: COMPANY, name: 'Pierre Dubois', phone: '+33 7 98 76 54 32', email: 'pierre@example.com', request_type: 'Proprietaire', source: 'Site web', message: 'Je souhaite confier mon appartement a Gueliz.', desired_date: '2026-07-01', status: 'A qualifier' },
    { company_id: COMPANY, name: 'Emma Fischer', phone: '+49 176 98765432', email: 'emma@example.com', request_type: 'Chauffeur prive', source: 'Google', message: 'Transfert aeroport Menara vers Palmeraie le 15 juillet.', desired_date: '2026-07-15', people_count: 2, estimated_budget: 350, status: 'Devis envoye' },
    { company_id: COMPANY, name: 'Mehdi Alaoui', phone: '+212 6 77 88 99 00', email: 'mehdi@example.com', request_type: 'Vehicule partenaire', source: 'Site web', message: "Besoin d un vehicule pour mariage le 20 aout.", desired_date: '2026-08-20', people_count: 8, estimated_budget: 2500, status: 'Nouveau' },
    { company_id: COMPANY, name: 'Claire Bernard', phone: '+33 6 99 88 77 66', email: 'claire@example.com', request_type: 'Service touristique', source: 'Site web', message: 'Excursion a Agafay pour 4 personnes.', desired_date: '2026-07-22', people_count: 4, estimated_budget: 2000, status: 'A qualifier' },
    { company_id: COMPANY, name: 'John Smith', phone: '+1 415 555 0123', email: 'john@example.com', request_type: 'General', source: 'Google', message: 'Informations sur vos services de conciergerie.', status: 'Nouveau' },
  ];
  const { error: eLeads } = await supabase.from('leads').insert(leads);
  if (eLeads) console.error('leads:', eLeads.message); else console.log('✓ leads');

  // ─── Apartments ───
  const apartments = [
    { company_id: COMPANY, internal_name: 'Majorelle Signature', public_name: 'Appartement Majorelle Signature', slug: 'appartement-majorelle-signature', district: 'Majorelle', public_district: 'Majorelle', bedrooms: 2, capacity: 4, price_from: 950, short_description: "Appartement elegant proche du Jardin Majorelle.", is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Suite Urbaine Gueliz', public_name: 'Suite Urbaine Gueliz', slug: 'suite-urbaine-gueliz', district: 'Gueliz', public_district: 'Gueliz', bedrooms: 1, capacity: 2, price_from: 650, short_description: "Adresse pratique et raffinee au coeur de Gueliz.", is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Hivernage Elegance', public_name: 'Appartement Hivernage Elegance', slug: 'appartement-hivernage-elegance', district: 'Hivernage', public_district: 'Hivernage', bedrooms: 2, capacity: 4, price_from: 1200, short_description: "Appartement premium dans l'un des quartiers les plus recherches de Marrakech.", is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Penthouse Terrasse M Avenue', public_name: 'Penthouse Terrasse M Avenue', slug: 'penthouse-terrasse-m-avenue', district: 'M Avenue', public_district: 'M Avenue', bedrooms: 2, capacity: 5, price_from: 1600, short_description: "Penthouse contemporain avec terrasse.", is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Riad Medina', public_name: 'Appartement Riad Medina', slug: 'appartement-riad-medina', district: 'Medina', public_district: 'Medina', bedrooms: 1, capacity: 3, price_from: 750, short_description: "Appartement au charme marocain, inspire de l'esprit riad.", is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Palmeraie Prestige', public_name: 'Residence Palmeraie Prestige', slug: 'residence-palmeraie-prestige', district: 'Palmeraie', public_district: 'Palmeraie', bedrooms: 3, capacity: 6, price_from: 1800, short_description: "Bien spacieux dans un environnement calme.", is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Agdal Moderne', public_name: 'Appartement Moderne Agdal', slug: 'appartement-moderne-agdal', district: 'Agdal', public_district: 'Agdal', bedrooms: 2, capacity: 4, price_from: 900, short_description: "Appartement moderne proche des axes principaux.", is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Victor Hugo Business', public_name: 'Business Flat Victor Hugo', slug: 'business-flat-victor-hugo', district: 'Victor Hugo', public_district: 'Victor Hugo', bedrooms: 1, capacity: 2, price_from: 700, short_description: "Appartement fonctionnel et elegant.", is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Ourika View', public_name: 'Terrasse Ourika View', slug: 'terrasse-ourika-view', district: "Route de l'Ourika", public_district: "Route de l'Ourika", bedrooms: 2, capacity: 4, price_from: 1050, short_description: "Adresse paisible avec terrasse.", is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Targa Confort', public_name: 'Appartement Confort Targa', slug: 'appartement-confort-targa', district: 'Targa', public_district: 'Targa', bedrooms: 2, capacity: 5, price_from: 850, short_description: "Appartement confortable dans un quartier residentiel calme.", is_published: true, is_featured: false },
  ];
  for (const a of apartments) {
    const { error } = await supabase.from('apartments').upsert(a, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) { console.error('apartments:', error.message); return; }
  }
  console.log('✓ apartments');

  // ─── Vehicles ───
  const vehicles = [
    { company_id: COMPANY, internal_name: 'Skoda Kodiaq Executive', vehicle_type: 'Vehicule Yakout', brand: 'Skoda', model: 'Kodiaq', capacity: 6, public_name: 'Skoda Kodiaq Executive', slug: 'skoda-kodiaq-executive', public_description: 'SUV confortable avec chauffeur prive, ideal pour transferts aeroport, trajets en ville et deplacements familiaux a Marrakech.', price_from: 350, with_driver: true, is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Mercedes Classe V Premium', vehicle_type: 'Vehicule Yakout', brand: 'Mercedes-Benz', model: 'Classe V', capacity: 7, public_name: 'Mercedes Classe V Premium', slug: 'mercedes-classe-v-premium', public_description: 'Van premium pour familles, groupes et transferts VIP, avec espace genereux et confort haut de gamme.', price_from: 800, with_driver: true, is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Hyundai H1 Confort', vehicle_type: 'Vehicule Yakout', brand: 'Hyundai', model: 'H1', capacity: 8, public_name: 'Hyundai H1 Confort', slug: 'hyundai-h1-confort', public_description: 'Vehicule spacieux pour groupes, transferts aeroport et excursions autour de Marrakech.', price_from: 650, with_driver: true, is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Dacia Lodgy Family', vehicle_type: 'Vehicule Yakout', brand: 'Dacia', model: 'Lodgy', capacity: 6, public_name: 'Dacia Lodgy Family', slug: 'dacia-lodgy-family', public_description: 'Solution familiale simple et confortable pour les trajets prives et transferts economiques.', price_from: 300, with_driver: true, is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Toyota Prado Prestige', vehicle_type: 'Vehicule Yakout', brand: 'Toyota', model: 'Prado', capacity: 6, public_name: 'Toyota Prado Prestige', slug: 'toyota-prado-prestige', public_description: 'SUV premium adapte aux excursions, trajets prives et deplacements confortables hors centre-ville.', price_from: 900, with_driver: true, is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Range Rover Vogue Partner', vehicle_type: 'Vehicule partenaire', brand: 'Range Rover', model: 'Vogue', capacity: 4, public_name: 'Range Rover Vogue Partner', slug: 'range-rover-vogue-partner', public_description: 'Vehicule partenaire haut de gamme pour demandes premium, evenements prives et deplacements exclusifs.', price_from: 1500, with_driver: true, is_published: true, is_featured: true },
    { company_id: COMPANY, internal_name: 'Mercedes Classe E Executive', vehicle_type: 'Vehicule Yakout', brand: 'Mercedes-Benz', model: 'Classe E', capacity: 3, public_name: 'Mercedes Classe E Executive', slug: 'mercedes-classe-e-executive', public_description: 'Berline executive pour rendez-vous, transferts discrets et deplacements professionnels.', price_from: 700, with_driver: true, is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Mercedes Sprinter Groupe', vehicle_type: 'Vehicule partenaire', brand: 'Mercedes-Benz', model: 'Sprinter', capacity: 15, public_name: 'Mercedes Sprinter Groupe', slug: 'mercedes-sprinter-groupe', public_description: 'Minibus adapte aux groupes, seminaires, familles nombreuses et excursions organisees.', price_from: 1200, with_driver: true, is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Renault Trafic Private Van', vehicle_type: 'Vehicule Yakout', brand: 'Renault', model: 'Trafic', capacity: 8, public_name: 'Renault Trafic Private Van', slug: 'renault-trafic-private-van', public_description: 'Van prive confortable pour transferts, circuits courts et deplacements de groupe a Marrakech.', price_from: 600, with_driver: true, is_published: true, is_featured: false },
    { company_id: COMPANY, internal_name: 'Toyota Land Cruiser Excursion', vehicle_type: 'Vehicule Yakout', brand: 'Toyota', model: 'Land Cruiser', capacity: 6, public_name: 'Toyota Land Cruiser Excursion', slug: 'toyota-land-cruiser-excursion', public_description: '4x4 robuste et confortable pour excursions vers Agafay, Ourika, Ouarzazate ou les environs de Marrakech.', price_from: 1100, with_driver: true, is_published: true, is_featured: true },
  ];
  for (const v of vehicles) {
    const { error } = await supabase.from('vehicles').upsert(v, { onConflict: 'slug', ignoreDuplicates: true });
    if (error) { console.error('vehicles:', error.message); return; }
  }
  console.log('✓ vehicles');

  // Fetch apartment/vehicle IDs for foreign key references
  const { data: apts } = await supabase.from('apartments').select('id, slug');
  const { data: vehs } = await supabase.from('vehicles').select('id, slug');
  const aptMap = Object.fromEntries((apts || []).map(a => [a.slug, a.id]));
  const vehMap = Object.fromEntries((vehs || []).map(v => [v.slug, v.id]));

  // ─── Reservations ───
  const reservations = [
    { company_id: COMPANY, client_id: CLIENTS.SARAH, apartment_id: aptMap['appartement-majorelle-signature'], check_in: '2026-07-12', check_out: '2026-07-18', people_count: 4, total_amount: 5700, deposit_amount: 2000, reservation_status: 'Confirmee' },
    { company_id: COMPANY, client_id: CLIENTS.FATIMA, apartment_id: aptMap['appartement-hivernage-elegance'], check_in: '2026-08-01', check_out: '2026-08-10', people_count: 5, total_amount: 10800, deposit_amount: 0, reservation_status: 'Pre-reservation' },
  ];
  for (const r of reservations) {
    const { error } = await supabase.from('reservations').insert(r);
    if (error) console.error('reservations:', error.message);
  }
  console.log('✓ reservations');

  // ─── Trips ───
  const trips = [
    { company_id: COMPANY, client_id: CLIENTS.YOUSSEF, vehicle_id: vehMap['skoda-kodiaq-executive'], trip_date: '2026-07-01', trip_time: '14:00', departure: 'Aeroport Marrakech Menara', destination: 'Hivernage', trip_type: 'Transfert', sold_price: 350, cost_price: 120, trip_status: 'Confirme' },
    { company_id: COMPANY, client_id: CLIENTS.THOMAS, vehicle_id: vehMap['skoda-kodiaq-executive'], trip_date: '2026-07-05', trip_time: '09:00', departure: 'Hivernage', destination: 'Agafay', trip_type: 'Excursion', sold_price: 800, cost_price: 250, trip_status: 'Confirme' },
  ];
  for (const t of trips) {
    const { error } = await supabase.from('trips').insert(t);
    if (error) console.error('trips:', error.message);
  }
  console.log('✓ trips');

  // Fetch reservation IDs
  const { data: resData } = await supabase.from('reservations').select('id, client_id').in('client_id', [CLIENTS.SARAH, CLIENTS.THOMAS]);
  const sarahRes = (resData || []).find(r => r.client_id === CLIENTS.SARAH);

  // ─── Payments ───
  const payments = [
    { company_id: COMPANY, client_id: CLIENTS.SARAH, reservation_id: sarahRes?.id, amount: 2000, paid_at: '2026-06-26', payment_method: 'Virement', activity_type: 'Appartement', status: 'Paye' },
    { company_id: COMPANY, client_id: CLIENTS.THOMAS, reservation_id: null, amount: 800, paid_at: '2026-06-28', payment_method: 'Especes', activity_type: 'Transport', status: 'Paye' },
  ];
  for (const p of payments) {
    const { error } = await supabase.from('payments').insert(p);
    if (error) console.error('payments:', error.message);
  }
  console.log('✓ payments');

  // ─── Expenses ───
  const expenses = [
    { company_id: COMPANY, expense_date: '2026-06-27', amount: 450, category: 'Menage', activity_type: 'Appartement', notes: 'Menage appartement Majorelle Signature' },
    { company_id: COMPANY, expense_date: '2026-06-28', amount: 200, category: 'Fournitures', activity_type: 'Appartement', notes: 'Linge de maison et consommables' },
    { company_id: COMPANY, expense_date: '2026-06-29', amount: 120, category: 'Carburant', activity_type: 'Transport', notes: 'Carburant Skoda Kodiaq' },
    { company_id: COMPANY, expense_date: '2026-06-30', amount: 300, category: 'Commission partenaire', activity_type: 'Transport', notes: 'Commission partenaire excursion Agafay' },
  ];
  const { error: eExp } = await supabase.from('expenses').insert(expenses);
  if (eExp) console.error('expenses:', eExp.message); else console.log('✓ expenses');

  console.log('\n✅ Seed complete!');
}

seed().catch(console.error);
