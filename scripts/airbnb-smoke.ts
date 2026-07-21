import { analyzeAirbnbListing } from "../lib/airbnb/analyze-listing.server";

async function main() {
 const url = process.argv[2];
 if (!url) throw new Error("Usage: npm run airbnb:smoke -- <URL Airbnb>");
 const started = Date.now();
 const result = await analyzeAirbnbListing(url);
 console.log(JSON.stringify({ ...result, data: result.success ? { listingId: result.data.source.listingId, title: result.data.identity.title, photos: result.data.photos.length, amenities: result.data.amenities.available.length } : undefined, durationMs: Date.now() - started }, null, 2));
 if (!result.success && result.code !== "AIRBNB_BLOCKED") process.exitCode = 1;
}
void main();
