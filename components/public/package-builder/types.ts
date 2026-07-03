export type TripStyle =
  | "couple"
  | "family"
  | "friends"
  | "business"
  | "anniversary"
  | "honeymoon"
  | "discovery"
  | "relaxation"
  | "custom";

export type StayInfo = {
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  origin: string;
  tripStyle: TripStyle;
  budget: number;
  objective: string;
};

export type ApartmentSelection = {
  id: string;
  slug: string;
  title: string;
  district: string;
  capacity: number;
  bedrooms: number;
  pricePerNight: number;
  imageUrl?: string;
};

export type ApartmentOption =
  | { type: "selected"; apartment: ApartmentSelection }
  | { type: "recommendation" }
  | { type: "none" };

export type TransferItem = {
  id: string;
  type: "arrival" | "departure" | "both" | "half_day" | "full_day" | "city_trip";
  airport: string;
  date: string;
  time: string;
  flightNumber: string;
  luggageCount: number;
  dropoffAddress: string;
};

export type VehicleSelection = {
  id: string;
  slug: string;
  title: string;
  capacity: number;
  priceTransfer: number;
  priceHalfDay: number;
  priceFullDay: number;
  imageUrl?: string;
};

export type VehicleOption =
  | { type: "selected"; vehicle: VehicleSelection; serviceType: "private" | "half_day" | "full_day" | "multi_day"; days: number }
  | { type: "recommendation"; serviceType: "private" | "half_day" | "full_day" | "multi_day"; days: number }
  | { type: "none" };

export type ExperienceItem = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  durationLabel: string;
  price: number;
  imageUrl?: string;
  date: string;
  people: number;
};

export type ExtraService = {
  id: string;
  label: string;
  price: number;
  details: string;
};

export type ContactInfo = {
  name: string;
  phone: string;
  email: string;
  preferredContact: "whatsapp" | "phone" | "email";
  message: string;
  whatsappConsent: boolean;
  callbackTime: string;
};

export type PricingEntry = {
  label: string;
  amount: number;
  type: "apartment" | "transfer" | "vehicle" | "experience" | "service";
};

export type PricingBreakdown = {
  entries: PricingEntry[];
  subtotals: Record<string, number>;
  estimatedTotal: number;
};

export type PackageState = {
  stay: StayInfo;
  apartment: ApartmentOption;
  transfers: TransferItem[];
  vehicle: VehicleOption;
  experiences: ExperienceItem[];
  services: ExtraService[];
  contact: ContactInfo;
  currentStep: number;
};

export type PackageAction =
  | { type: "SET_STAY"; payload: StayInfo }
  | { type: "SET_APARTMENT"; payload: ApartmentOption }
  | { type: "ADD_TRANSFER"; payload: TransferItem }
  | { type: "REMOVE_TRANSFER"; payload: string }
  | { type: "SET_VEHICLE"; payload: VehicleOption }
  | { type: "ADD_EXPERIENCE"; payload: ExperienceItem }
  | { type: "REMOVE_EXPERIENCE"; payload: string }
  | { type: "UPDATE_EXPERIENCE"; payload: { id: string; date: string; people: number } }
  | { type: "ADD_SERVICE"; payload: ExtraService }
  | { type: "REMOVE_SERVICE"; payload: string }
  | { type: "UPDATE_SERVICE"; payload: { id: string; details: string } }
  | { type: "SET_CONTACT"; payload: Partial<ContactInfo> }
  | { type: "SET_STEP"; payload: number }
  | { type: "RESET" };

export type PackageBuilderData = {
  apartments: ApartmentSelection[];
  vehicles: VehicleSelection[];
  experiences: ExperienceItem[];
};

export function getDefaultStay(): StayInfo {
  return {
    arrivalDate: "",
    departureDate: "",
    nights: 0,
    adults: 2,
    children: 0,
    origin: "",
    tripStyle: "discovery",
    budget: 0,
    objective: "",
  };
}

export function getDefaultContact(): ContactInfo {
  return {
    name: "",
    phone: "",
    email: "",
    preferredContact: "whatsapp",
    message: "",
    whatsappConsent: true,
    callbackTime: "",
  };
}

export function createInitialState(): PackageState {
  return {
    stay: getDefaultStay(),
    apartment: { type: "none" },
    transfers: [],
    vehicle: { type: "none" },
    experiences: [],
    services: [],
    contact: getDefaultContact(),
    currentStep: 0,
  };
}

export function packageReducer(state: PackageState, action: PackageAction): PackageState {
  switch (action.type) {
    case "SET_STAY":
      return { ...state, stay: action.payload };
    case "SET_APARTMENT":
      return { ...state, apartment: action.payload };
    case "ADD_TRANSFER":
      return { ...state, transfers: [...state.transfers.filter((t) => t.type !== action.payload.type || action.payload.type === "city_trip"), action.payload] };
    case "REMOVE_TRANSFER":
      return { ...state, transfers: state.transfers.filter((t) => t.id !== action.payload) };
    case "SET_VEHICLE":
      return { ...state, vehicle: action.payload };
    case "ADD_EXPERIENCE":
      return { ...state, experiences: [...state.experiences, action.payload] };
    case "REMOVE_EXPERIENCE":
      return { ...state, experiences: state.experiences.filter((e) => e.id !== action.payload) };
    case "UPDATE_EXPERIENCE":
      return {
        ...state,
        experiences: state.experiences.map((e) =>
          e.id === action.payload.id ? { ...e, date: action.payload.date, people: action.payload.people } : e
        ),
      };
    case "ADD_SERVICE":
      return { ...state, services: [...state.services, action.payload] };
    case "REMOVE_SERVICE":
      return { ...state, services: state.services.filter((s) => s.id !== action.payload) };
    case "UPDATE_SERVICE":
      return {
        ...state,
        services: state.services.map((s) =>
          s.id === action.payload.id ? { ...s, details: action.payload.details } : s
        ),
      };
    case "SET_CONTACT":
      return { ...state, contact: { ...state.contact, ...action.payload } };
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "RESET":
      return createInitialState();
    default:
      return state;
  }
}

export const STEP_LABELS = [
  "Votre séjour",
  "Hébergement",
  "Arrivée & transferts",
  "Véhicule & chauffeur",
  "Expériences",
  "Services complémentaires",
  "Contact & envoi",
] as const;

export const STEP_DESCRIPTIONS = [
  "Quand, combien, quel style",
  "Choisissez votre hébergement",
  "Arrivée à Marrakech",
  "Mobilité premium",
  "Vivez Marrakech",
  "Touches finales",
  "Finalisez votre demande",
] as const;

export const TRIP_STYLE_OPTIONS: { value: TripStyle; label: string; emoji: string }[] = [
  { value: "couple", label: "Escapade couple", emoji: "💑" },
  { value: "family", label: "Séjour famille", emoji: "👨‍👩‍👧‍👦" },
  { value: "friends", label: "Voyage entre amis", emoji: "🎉" },
  { value: "business", label: "Business & pro", emoji: "💼" },
  { value: "anniversary", label: "Anniversaire", emoji: "🎂" },
  { value: "honeymoon", label: "Lune de miel", emoji: "💕" },
  { value: "discovery", label: "Découverte", emoji: "🗺️" },
  { value: "relaxation", label: "Détente", emoji: "🧘" },
  { value: "custom", label: "Sur mesure", emoji: "✨" },
];

export const OBJECTIVE_OPTIONS = [
  { value: "hebergement", label: "Hébergement & confort" },
  { value: "decouverte", label: "Découverte de Marrakech" },
  { value: "transport", label: "Transport facile" },
  { value: "experiences", label: "Expériences & excursions" },
  { value: "complet", label: "Séjour clé en main" },
  { value: "mix", label: "Mix de tout" },
];

export const EXTRA_SERVICE_OPTIONS: ExtraService[] = [
  { id: "welcome", label: "Accueil personnalisé à l'arrivée", price: 350, details: "" },
  { id: "groceries", label: "Courses avant votre arrivée", price: 250, details: "" },
  { id: "decoration", label: "Décoration spéciale (anniversaire, lune de miel...)", price: 500, details: "" },
  { id: "cleaning", label: "Ménage supplémentaire en cours de séjour", price: 300, details: "" },
  { id: "assistance", label: "Assistance WhatsApp dédiée tout le séjour", price: 200, details: "" },
  { id: "restaurant", label: "Réservation restaurant", price: 0, details: "" },
  { id: "guide", label: "Guide local privé", price: 600, details: "" },
  { id: "surprise", label: "Organisation surprise / événement", price: 800, details: "" },
  { id: "photographer", label: "Séance photo professionnelle", price: 1200, details: "" },
  { id: "hammam", label: "Soin hammam / spa à réserver", price: 400, details: "" },
];

export function nightsBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
