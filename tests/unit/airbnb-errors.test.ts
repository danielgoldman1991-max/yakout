import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAirbnbError } from "../../lib/airbnb/errors";

test("une erreur inconnue conserve la couche de navigation", () => {
  const error = normalizeAirbnbError(new Error("unexpected redirect state"), "navigation");
  assert.equal(error.code, "AIRBNB_NAVIGATION_FAILED");
  assert.equal(error.stage, "navigation");
});

test("une erreur inconnue conserve la couche d’extraction", () => {
  const error = normalizeAirbnbError(new Error("unexpected parser state"), "extraction");
  assert.equal(error.code, "AIRBNB_EXTRACTION_FAILED");
  assert.equal(error.stage, "extraction");
});

test("une erreur inconnue au lancement reste un échec navigateur", () => {
  const error = normalizeAirbnbError(new Error("unknown launch failure"), "browser-launch");
  assert.equal(error.code, "AIRBNB_BROWSER_LAUNCH_FAILED");
  assert.equal(error.stage, "browser-launch");
});
