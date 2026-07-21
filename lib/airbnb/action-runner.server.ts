import "server-only";

import { analyzeAirbnbListing } from "./analyze-listing.server";
import { normalizeAirbnbError } from "./errors";
import { buildShortDescription, extractionContentHash, mapPropertyType } from "./normalization";
import type { AirbnbListingExtraction } from "./types";
import type { AirbnbAnalysisState } from "./actions";

export function toSerializableAirbnbListing(extraction: AirbnbListingExtraction): AirbnbListingExtraction {
  const serialized = JSON.parse(JSON.stringify(extraction)) as AirbnbListingExtraction;
  structuredClone(serialized);
  return serialized;
}

export async function runAirbnbAnalysis(rawUrl: string, requestId: string, analyzer = analyzeAirbnbListing): Promise<AirbnbAnalysisState> {
  try {
    const result = await analyzer(rawUrl, { requestId });
    if (!result.success) {
      const normalized = normalizeAirbnbError(new Error(result.message));
      return { success: false, code: result.code, message: result.message, requestId, retryable: normalized.retryable, sourceUrl: rawUrl, listingId: new URL(rawUrl).pathname.match(/^\/rooms\/(\d+)/)?.[1] };
    }
    const extraction = toSerializableAirbnbListing(result.data);
    extraction.raw = { jsonLd: extraction.raw.jsonLd, extractedTexts: {} };
    const preview = { extraction, contentHash: extractionContentHash(extraction), generatedShortDescription: buildShortDescription(extraction), mappedPropertyType: mapPropertyType(extraction.identity.propertyTypeLabel, extraction.identity.roomType), partial: Boolean(result.partial), warnings: Array.isArray(result.warnings) ? result.warnings.map(String) : [] };
    structuredClone(preview);
    return { success: true, data: extraction, partial: preview.partial, warnings: preview.warnings, requestId, sourceUrl: rawUrl, listingId: extraction.source.listingId, preview };
  } catch (error) {
    const normalized = normalizeAirbnbError(error);
    console.error("[airbnb-import] server action failed", { requestId, code: normalized.code, stage: normalized.stage, name: error instanceof Error ? error.name : undefined, message: error instanceof Error ? error.message : String(error), cause: error instanceof Error && "cause" in error ? String(error.cause) : undefined, stack: error instanceof Error ? error.stack : undefined });
    return { success: false, code: normalized.code, message: normalized.publicMessage, requestId, retryable: normalized.retryable, sourceUrl: rawUrl };
  }
}
