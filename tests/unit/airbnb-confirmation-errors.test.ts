import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAirbnbConfirmationError } from "../../lib/airbnb/errors";

test("une erreur Supabase objet n’est plus masquée en Import impossible", () => {
  const result = normalizeAirbnbConfirmationError(
    { code: "PGRST204", message: "Could not find a database column", details: "schema cache" },
    "apartment-write",
  );
  assert.equal(result.code, "PGRST204");
  assert.match(result.publicMessage, /base Yakout n’est pas à jour/);
  assert.match(result.internalMessage, /schema cache/);
});

test("un doublon reçoit un message actionnable", () => {
  const result = normalizeAirbnbConfirmationError(
    { code: "23505", message: "duplicate key value violates unique constraint" },
    "apartment-write",
  );
  assert.match(result.publicMessage, /déjà liée/);
});
