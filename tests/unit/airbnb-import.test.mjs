import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

const listingId = (url) => new URL(url).pathname.match(/^\/rooms\/(\d+)/)?.[1] ?? null;
const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const stableHash = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("extrait l’identifiant de l’annonce demandée", () => assert.equal(listingId("https://fr.airbnb.com/rooms/1691872650571602529"), "1691872650571602529"));
test("rejette un chemin qui n’est pas une annonce", () => assert.equal(listingId("https://fr.airbnb.com/help"), null));
test("normalise les accents des équipements", () => assert.equal(normalize("Détecteur de fumée"), "detecteur de fumee"));
test("le hash change quand le contenu change", () => assert.notEqual(stableHash({ title: "A" }), stableHash({ title: "B" })));
test("le hash reste identique pour un contenu identique", () => assert.equal(stableHash({ title: "A" }), stableHash({ title: "A" })));
