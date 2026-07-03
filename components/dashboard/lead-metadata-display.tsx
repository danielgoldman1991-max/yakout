const metaLabels: Record<string, string> = {
  // Reservation
  check_in: "Date d'arrivée",
  check_out: "Date de départ",
  guests_count: "Nombre de voyageurs",
  bedrooms_needed: "Chambres souhaitées",
  preferred_district: "Quartier préféré",
  budget: "Budget / nuit (MAD)",
  transfer_needed: "Transfert aéroport",
  driver_needed: "Chauffeur pendant séjour",
  arrival_time: "Heure d'arrivée",
  special_requests: "Demande spéciale",
  // Chauffeur
  transport_need: "Type de besoin",
  vehicle_preference: "Preference vehicule",
  chauffeur_needed: "Chauffeur necessaire",
  transport_type: "Type de trajet",
  pickup_date: "Date",
  pickup_time: "Heure",
  pickup_location: "Lieu de prise en charge",
  dropoff_location: "Destination",
  passengers_count: "Nombre de passagers",
  luggage_count: "Nombre de bagages",
  flight_number: "Numéro de vol",
  return_needed: "Retour nécessaire",
  preferred_vehicle: "Véhicule préféré",
  // Vehicule
  duration_type: "Durée",
  vehicle_date: "Date souhaitée",
  vehicle_passengers: "Passagers",
  vehicle_luggage: "Bagages",
  vehicle_pickup: "Prise en charge",
  vehicle_dropoff: "Destination",
  francophone_driver: "Chauffeur francophone",
  // Proprietaire
  property_type: "Type de bien",
  property_district: "Quartier",
  property_bedrooms: "Nombre de chambres",
  is_furnished: "Meublé",
  already_listed: "Déjà listé (Airbnb/Booking)",
  owner_goal: "Objectif",
  callback_availability: "Disponibilité rappel",
  // Services
  service_category: "Catégorie de service",
  service_date: "Date souhaitée",
  people_count: "Nombre de personnes",
  service_budget: "Budget (MAD)",
  service_location: "Lieu / quartier",
  service_details: "Description",
  // Package
  package_slug: "Pack demande",
  stay_start: "Debut sejour",
  stay_end: "Fin sejour",
  package_people_count: "Nombre de personnes",
  package_budget: "Budget pack",
  need_apartment: "Besoin appartement",
  need_transfer: "Besoin transfert",
  need_driver: "Besoin chauffeur",
  selected_options: "Options souhaitees",
};

const transportTypeLabels: Record<string, string> = {
  transfert_aeroport: "Transfert aéroport",
  trajet_ville: "Trajet en ville",
  demi_journee: "Demi-journée",
  journee: "Journée",
  excursion: "Excursion",
};

const transportNeedLabels: Record<string, string> = {
  transfert_aeroport: "Transfert aeroport",
  chauffeur_prive: "Chauffeur prive",
  mise_a_disposition: "Mise a disposition",
  circuit: "Circuit",
  transport_groupe: "Transport groupe",
  autre: "Autre",
};

const yesNoLabels: Record<string, string> = {
  oui: "Oui",
  non: "Non",
};

const durationTypeLabels: Record<string, string> = {
  trajet_simple: "Trajet simple",
  demi_journee: "Demi-journée",
  journee: "Journée",
  plusieurs_jours: "Plusieurs jours",
};

const propertyTypeLabels: Record<string, string> = {
  appartement: "Appartement",
  villa: "Villa",
  riad: "Riad",
  studio: "Studio",
  autre: "Autre",
};

const serviceCategoryLabels: Record<string, string> = {
  organisation_sejour: "Organisation séjour",
  excursion: "Excursion",
  restaurant_sortie: "Restaurant / sortie",
  experience_touristique: "Expérience touristique",
  courses_assistance: "Courses / assistance",
  autre: "Autre",
};

function formatMetaValue(key: string, value: string): string {
  if (value === "" || value == null) return "";
  // Date values look like YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
  if (key === "transport_type" && transportTypeLabels[value]) return transportTypeLabels[value];
  if (key === "transport_need" && transportNeedLabels[value]) return transportNeedLabels[value];
  if (key === "duration_type" && durationTypeLabels[value]) return durationTypeLabels[value];
  if (key === "property_type" && propertyTypeLabels[value]) return propertyTypeLabels[value];
  if (key === "service_category" && serviceCategoryLabels[value]) return serviceCategoryLabels[value];
  if (["transfer_needed", "driver_needed", "return_needed", "is_furnished", "already_listed", "francophone_driver", "need_apartment", "need_transfer", "need_driver", "chauffeur_needed"].includes(key)) {
    return yesNoLabels[value] || value;
  }
  // Capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const sectionOrder: Record<string, string[]> = {
  reservation: ["check_in", "check_out", "guests_count", "bedrooms_needed", "preferred_district", "budget", "arrival_time", "transfer_needed", "driver_needed", "special_requests"],
  transport: ["transport_need", "pickup_date", "pickup_time", "pickup_location", "dropoff_location", "passengers_count", "luggage_count", "vehicle_preference", "flight_number", "return_needed", "chauffeur_needed"],
  chauffeur: ["transport_type", "pickup_date", "pickup_time", "pickup_location", "dropoff_location", "passengers_count", "luggage_count", "flight_number", "return_needed", "preferred_vehicle"],
  vehicule: ["duration_type", "vehicle_date", "vehicle_passengers", "vehicle_luggage", "vehicle_pickup", "vehicle_dropoff", "francophone_driver"],
  proprietaire: ["property_type", "property_district", "property_bedrooms", "is_furnished", "already_listed", "owner_goal", "callback_availability"],
  services: ["service_category", "service_date", "people_count", "service_budget", "service_location", "service_details"],
  package: ["package_slug", "stay_start", "stay_end", "package_people_count", "package_budget", "need_apartment", "need_transfer", "need_driver", "selected_options"],
};

export function MetadataDisplay({ metadata, requestType }: { metadata: Record<string, string>; requestType: string }) {
  const keys = sectionOrder[requestType] || Object.keys(metadata);

  const rows = keys
    .filter((key) => metadata[key] && metadata[key] !== "")
    .map((key) => {
      const value = formatMetaValue(key, metadata[key]);
      return (
        <div key={key} className="flex justify-between gap-4 border-b border-border/30 py-2.5 text-sm last:border-0">
          <span className="text-muted-foreground/70">{metaLabels[key] || key}</span>
          <span className="font-medium text-foreground text-right">{value}</span>
        </div>
      );
    });

  if (rows.length === 0) return null;

  return <div>{rows}</div>;
}
