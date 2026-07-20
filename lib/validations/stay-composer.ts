import { z } from "zod";

const apiDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");
const optionalText = z.string().trim().max(1000).optional().transform((value) => value || undefined);
const flight = z.object({
  airport: z.literal("RAK"),
  airline: optionalText,
  flightNumber: optionalText,
  date: apiDate,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide."),
  passengers: z.number().int().min(1).max(30),
  specialLuggage: optionalText,
});

export const accommodationSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("selected_apartment"), apartmentId: z.string().uuid() }),
  z.object({
    mode: z.literal("yakout_suggestion"),
    preferences: z.object({
      atmosphere: z.array(z.string().trim()).max(6).optional(),
      requiredAmenities: z.array(z.string().trim()).max(12).optional(),
      minimumBedrooms: z.number().int().min(1).max(20).nullable().optional(),
    }).optional(),
  }),
  z.object({
    mode: z.literal("external_accommodation"),
    accommodationName: z.string().trim().min(2, "Indiquez le nom de l’hébergement."),
    publicLocation: optionalText,
  }),
]);

export const airportTransferSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("none") }),
  z.object({ mode: z.literal("arrival"), arrival: flight }),
  z.object({ mode: z.literal("departure"), departure: flight }),
  z.object({ mode: z.literal("round_trip"), arrival: flight, departure: flight }),
]);

export const stayComposerSchema = z.object({
  operationId: z.string().uuid(),
  composerMode: z.enum(["package_selected", "apartment_selected", "custom_stay"]),
  packageId: z.string().uuid().nullable(),
  apartmentId: z.string().uuid().nullable(),
  stay: z.object({
    checkIn: apiDate,
    checkOut: apiDate,
    adults: z.number().int().min(1).max(30),
    children: z.number().int().min(0).max(30),
    infants: z.number().int().min(0).max(10),
  }),
  accommodation: accommodationSchema,
  airportTransfer: airportTransferSchema,
  privateDriver: z.object({
    selected: z.boolean(),
    serviceType: z.enum(["few_trips", "half_day", "full_day", "multi_day", "to_define"]).nullable(),
    dateFrom: apiDate.nullable(),
    dateTo: apiDate.nullable(),
    notes: optionalText,
  }),
  serviceIds: z.array(z.string().uuid()).max(20),
  serviceDetails: z.record(z.string(), z.string().max(1000)),
  contact: z.object({
    name: z.string().trim().min(2, "Le nom est obligatoire."),
    phone: z.string().trim().min(6, "Le téléphone est obligatoire."),
    email: z.union([z.email("E-mail invalide."), z.literal("")]),
    preferredChannel: z.enum(["whatsapp", "phone", "email"]),
  }),
  message: optionalText,
  consent: z.literal(true, { message: "Votre accord est nécessaire pour vous recontacter." }),
  pageUrl: z.string().url().optional(),
}).superRefine((data, ctx) => {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (data.stay.checkIn < todayKey) ctx.addIssue({ code: "custom", path: ["stay", "checkIn"], message: "La date d’arrivée ne peut pas être passée." });
  if (data.stay.checkOut <= data.stay.checkIn) ctx.addIssue({ code: "custom", path: ["stay", "checkOut"], message: "Le départ doit être après l’arrivée." });
  if (data.accommodation.mode === "selected_apartment" && data.apartmentId !== data.accommodation.apartmentId) {
    ctx.addIssue({ code: "custom", path: ["accommodation"], message: "L’appartement sélectionné est incohérent." });
  }
  if (data.contact.preferredChannel === "email" && !data.contact.email) {
    ctx.addIssue({ code: "custom", path: ["contact", "email"], message: "L’e-mail est requis pour ce moyen de contact." });
  }
});

export type StayComposerInput = z.infer<typeof stayComposerSchema>;
