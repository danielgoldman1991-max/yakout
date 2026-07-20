import { test, expect } from "@playwright/test";
import { extractAirbnbListing } from "../../lib/airbnb/extraction.server";

test.skip(process.env.RUN_AIRBNB_LIVE_TEST !== "true", "Test live activé explicitement uniquement");
test("analyse l’annonce sans import", async () => {
  const extraction = await extractAirbnbListing("https://fr.airbnb.com/rooms/1691872650571602529");
  expect(extraction.source.listingId).toBe("1691872650571602529");
  expect(extraction.identity.title).toBeTruthy();
  expect(extraction.photos.length).toBeGreaterThan(0);
  expect(JSON.stringify(extraction)).not.toMatch(/wifi_password|access_instructions|owner_id/);
});
