export type AirbnbRoomType = "entire_place" | "private_room" | "shared_room" | "unknown";

export type AirbnbListingExtraction = {
  source: { platform: "airbnb"; listingId: string; url: string; extractedAt: string; language: string; pageTitle: string | null };
  identity: { title: string | null; subtitle: string | null; propertyTypeLabel: string | null; roomType: AirbnbRoomType };
  capacity: { maxGuests: number | null; bedrooms: number | null; beds: number | null; bathrooms: number | null; sleepingArrangements: Array<{ room: string | null; beds: Array<{ type: string; quantity: number }> }> };
  location: { city: string | null; district: string | null; region: string | null; country: string | null; publicLocationLabel: string | null; neighborhoodDescription: string | null };
  descriptions: { summary: string | null; space: string | null; guestAccess: string | null; otherThingsToNote: string | null; neighborhood: string | null };
  amenities: { available: Array<{ sourceLabel: string; normalizedKey: string | null; category: string | null }>; unavailable: Array<{ sourceLabel: string; normalizedKey: string | null }> };
  rules: { checkInFrom: string | null; checkInUntil: string | null; checkOutBefore: string | null; maxGuests: number | null; petsAllowed: boolean | null; smokingAllowed: boolean | null; eventsAllowed: boolean | null; additionalRules: string[] };
  safety: Array<{ label: string; status: "available" | "unavailable" | "warning" | "unknown" }>;
  photos: Array<{ order: number; sourceUrl: string; highResolutionUrl: string; caption: string | null; roomLabel: string | null; altText: string | null; width: number | null; height: number | null }>;
  platformMetrics: { rating: number | null; reviewCount: number | null; guestFavorite: boolean | null; hostName: string | null; superhost: boolean | null };
  priceSnapshot: { amount: number | null; currency: string | null; observedAt: string | null; dateContext: string | null };
  raw: { jsonLd: unknown[]; extractedTexts: Record<string, string> };
  warnings: string[];
  missingFields: string[];
  confidence: Record<string, number>;
};

export type AirbnbImportMode = "create" | "fill_empty" | "selective_update";

