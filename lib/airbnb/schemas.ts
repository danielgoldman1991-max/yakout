import { z } from "zod";

const ns = z.string().trim().nullable();
const nn = z.number().nonnegative().nullable();

export const airbnbUrlSchema = z.string().url().superRefine((value, context) => {
  const url = new URL(value);
  if (!/(^|\.)airbnb\.(com|fr)$/.test(url.hostname) || !/^\/rooms\/\d+/.test(url.pathname)) context.addIssue({ code: "custom", message: "Cette URL ne correspond pas à une annonce Airbnb valide." });
});

export const airbnbExtractionSchema = z.object({
  source: z.object({ platform: z.literal("airbnb"), listingId: z.string().regex(/^\d+$/), url: airbnbUrlSchema, extractedAt: z.iso.datetime(), language: z.string(), pageTitle: ns }),
  identity: z.object({ title: ns, subtitle: ns, propertyTypeLabel: ns, roomType: z.enum(["entire_place", "private_room", "shared_room", "unknown"]) }),
  capacity: z.object({ maxGuests: nn, bedrooms: nn, beds: nn, bathrooms: nn, sleepingArrangements: z.array(z.object({ room: ns, beds: z.array(z.object({ type: z.string(), quantity: z.number().int().positive() })) })) }),
  location: z.object({ city: ns, district: ns, region: ns, country: ns, publicLocationLabel: ns, neighborhoodDescription: ns }),
  descriptions: z.object({ summary: ns, space: ns, guestAccess: ns, otherThingsToNote: ns, neighborhood: ns }),
  amenities: z.object({ available: z.array(z.object({ sourceLabel: z.string(), normalizedKey: ns, category: ns })), unavailable: z.array(z.object({ sourceLabel: z.string(), normalizedKey: ns })) }),
  rules: z.object({ checkInFrom: ns, checkInUntil: ns, checkOutBefore: ns, maxGuests: nn, petsAllowed: z.boolean().nullable(), smokingAllowed: z.boolean().nullable(), eventsAllowed: z.boolean().nullable(), additionalRules: z.array(z.string()) }),
  safety: z.array(z.object({ label: z.string(), status: z.enum(["available", "unavailable", "warning", "unknown"]) })),
  photos: z.array(z.object({ order: z.number().int().nonnegative(), sourceUrl: z.string().url(), highResolutionUrl: z.string().url(), caption: ns, roomLabel: ns, altText: ns, width: nn, height: nn })),
  platformMetrics: z.object({ rating: nn, reviewCount: nn, guestFavorite: z.boolean().nullable(), hostName: ns, superhost: z.boolean().nullable() }),
  priceSnapshot: z.object({ amount: nn, currency: ns, observedAt: ns, dateContext: ns }),
  raw: z.object({ jsonLd: z.array(z.unknown()), extractedTexts: z.record(z.string(), z.string()) }),
  warnings: z.array(z.string()), missingFields: z.array(z.string()), confidence: z.record(z.string(), z.number().min(0).max(1)),
});

export const airbnbImportPreviewSchema = z.object({ extraction: airbnbExtractionSchema, contentHash: z.string().regex(/^[a-f0-9]{64}$/), generatedShortDescription: z.string().max(220), mappedPropertyType: z.enum(["apartment", "studio", "villa", "riad", "house", "private_room", "penthouse", "other"]) });

export const airbnbImportConfirmationSchema = z.object({ extraction: airbnbExtractionSchema, contentHash: z.string().regex(/^[a-f0-9]{64}$/), ownerId: z.string().uuid(), title: z.string().trim().min(2).max(160), city: z.string().trim().min(2).max(100), propertyType: z.enum(["apartment", "studio", "villa", "riad", "house", "private_room", "penthouse", "other"]), shortDescription: z.string().trim().max(220), mode: z.enum(["create", "fill_empty", "selective_update"]), imageRightsConfirmed: z.boolean(), selectedPhotoUrls: z.array(z.string().url()).max(6), pricePerNight: z.number().positive().nullable(), currency: z.string().length(3).default("MAD") });
