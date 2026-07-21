import assert from "node:assert/strict";
import test from "node:test";
import { classifyClientRequest, clientRequestIdempotencyKey, isClientRequestActionable } from "../../lib/client-booking/request-booking";

test("classe les demandes sans transformer un transport en trajet", () => {
  assert.equal(classifyClientRequest("reservation"), "accommodation");
  assert.equal(classifyClientRequest("package"), "package");
  assert.equal(classifyClientRequest("transport"), "transport");
  assert.equal(classifyClientRequest("general"), "composite_stay");
});

test("génère une clé stable contre le double clic", () => {
  const id = "12345678-1234-4234-8234-123456789abc";
  assert.equal(clientRequestIdempotencyKey(id), clientRequestIdempotencyKey(id));
  assert.equal(clientRequestIdempotencyKey(id), `lead:${id}:primary`);
});

test("une demande traitée ne redevient pas réservable", () => {
  assert.equal(isClientRequestActionable("converted"), true);
  assert.equal(isClientRequestActionable("partially_booked"), true);
  assert.equal(isClientRequestActionable("booked"), false);
  assert.equal(isClientRequestActionable("declined"), false);
});
