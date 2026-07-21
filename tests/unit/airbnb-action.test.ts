import test from "node:test";
import assert from "node:assert/strict";
import { runAirbnbAnalysis, toSerializableAirbnbListing } from "../../lib/airbnb/action-runner.server";
import type { AirbnbListingExtraction } from "../../lib/airbnb/types";

test("une exception de l’analyseur devient un échec sérialisable sans rejet", async () => {
  const result = await runAirbnbAnalysis(
    "https://fr.airbnb.com/rooms/1691872650571602529",
    "12345678-1234-4234-8234-123456789abc",
    async () => { throw new Error("browser exploded"); },
  );
  assert.equal(result?.success, false);
  if (!result || result.success) return;
  assert.equal(result.code, "AIRBNB_INTERNAL_ERROR");
  assert.equal(result.requestId, "12345678-1234-4234-8234-123456789abc");
  assert.doesNotThrow(() => structuredClone(result));
});

test("la fiche envoyée au client ne contient que des valeurs sérialisables", () => {
  const listing = {
    source: { platform: "airbnb", listingId: "1691872650571602529", url: "https://fr.airbnb.com/rooms/1691872650571602529", extractedAt: new Date().toISOString(), language: "fr", pageTitle: "Annonce" },
    identity: { title: "Appartement", subtitle: null, propertyTypeLabel: null, roomType: "unknown" },
    raw: { jsonLd: [], extractedTexts: {} },
    warnings: [], missingFields: [], photos: [],
  } as unknown as AirbnbListingExtraction;
  const serialized = toSerializableAirbnbListing(listing);
  assert.doesNotThrow(() => structuredClone(serialized));
  assert.equal(Object.getPrototypeOf(serialized), Object.prototype);
});
