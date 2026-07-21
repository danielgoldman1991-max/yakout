import assert from "node:assert/strict";
import test from "node:test";
import { extractCanonicalAirbnbListing } from "../../lib/airbnb/extraction.server";

test("le modèle canonique privilégie les données propres à l’annonce", () => {
  const listingId = "1697311292124063189";
  const photo = `https://a0.muscache.com/im/pictures/hosting/Hosting-${listingId}/original/photo.jpeg`;
  const html = `<html><head><title>Airbnb&nbsp;: locations de vacances, cabanes</title><script type="application/ld+json">${JSON.stringify({ "@type": "VacationRental", name: "Séjour de luxe à Marrakech.", description: "Description", image: [photo], address: { addressLocality: "Marrakech" } })}</script></head><body><script>window.data={"overview":{"__typename":"StaysPdpOverview","title":"Logement entier : appartement - Marrakech, Maroc","items":["4 voyageurs","1 chambre","1 lit","1 salle de bain"]}}</script></body></html>`;
  const result = extractCanonicalAirbnbListing(html, `https://fr.airbnb.com/rooms/${listingId}`, listingId);
  assert.deepEqual({ title: result.title, type: result.propertyType, city: result.city, country: result.country, guests: result.maxGuests, bedrooms: result.bedrooms, beds: result.beds, bathrooms: result.bathrooms, photos: result.photos.length }, { title: "Séjour de luxe à Marrakech.", type: "apartment", city: "Marrakech", country: "Maroc", guests: 4, bedrooms: 1, beds: 1, bathrooms: 1, photos: 1 });
});
