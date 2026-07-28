import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIntegerCount } from "../../lib/airbnb/normalization";

test("normalise les demi-salles de bain pour la colonne entière Supabase", () => {
  assert.equal(normalizeIntegerCount(1.5), 1);
  assert.equal(normalizeIntegerCount(2), 2);
});

test("refuse les capacités négatives ou non numériques", () => {
  assert.equal(normalizeIntegerCount(-2), 0);
  assert.equal(normalizeIntegerCount(Number.NaN), 0);
  assert.equal(normalizeIntegerCount(null), 0);
});
