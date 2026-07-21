import { analyzeAirbnbListing } from "../lib/airbnb/analyze-listing.server";
import { canonicalPropertyType } from "../lib/airbnb/normalization";

async function main() {
const url = process.argv[2];
if (!url) throw new Error('Usage: npm run airbnb:inspect -- "URL Airbnb"');
const result = await analyzeAirbnbListing(url);
if (!result.success) throw new Error(`${result.code}: ${result.message} (${result.requestId})`);
const listing = result.data;
const output = {
  title: listing.identity.title,
  propertyType: canonicalPropertyType(listing.identity.propertyTypeLabel),
  propertyTypeLabel: listing.identity.propertyTypeLabel,
  city: listing.location.city,
  country: listing.location.country,
  maxGuests: listing.capacity.maxGuests,
  bedrooms: listing.capacity.bedrooms,
  beds: listing.capacity.beds,
  bathrooms: listing.capacity.bathrooms,
  photoCount: listing.photos.length,
  photos: listing.photos.slice(0, 5).map(({ highResolutionUrl, width, height }) => ({ url: highResolutionUrl, width, height, source: "structured-data" })),
  warnings: listing.warnings,
};
console.log(JSON.stringify(output, null, 2));

if (new URL(url).pathname.includes("1697311292124063189")) {
  const expected = { title: "Séjour de luxe à Las Torres Majorelle Marrakech.", propertyType: "apartment", city: "Marrakech", country: "Maroc", maxGuests: 4, bedrooms: 1, beds: 1, bathrooms: 1 };
  for (const [field, value] of Object.entries(expected)) if (output[field as keyof typeof output] !== value) throw new Error(`Critère d’acceptation non satisfait : ${field}`);
  if (output.photoCount < 5 || output.photos.some((photo) => !photo.url.includes("1697311292124063189") || /svg|avatar|placeholder/i.test(photo.url))) throw new Error("Critère d’acceptation non satisfait : photos");
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
