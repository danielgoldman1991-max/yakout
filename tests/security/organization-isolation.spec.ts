import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

test("deux organisations ne lisent pas leurs appartements mutuels", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const emailA = process.env.TEST_ORG_A_EMAIL;
  const passwordA = process.env.TEST_ORG_A_PASSWORD;
  const emailB = process.env.TEST_ORG_B_EMAIL;
  const passwordB = process.env.TEST_ORG_B_PASSWORD;
  expect(url && anonKey && emailA && passwordA && emailB && passwordB, "Deux comptes de test isolés sont requis").toBeTruthy();

  const a = createClient(url!, anonKey!, { auth: { persistSession: false } });
  const b = createClient(url!, anonKey!, { auth: { persistSession: false } });
  expect((await a.auth.signInWithPassword({ email: emailA!, password: passwordA! })).error).toBeNull();
  expect((await b.auth.signInWithPassword({ email: emailB!, password: passwordB! })).error).toBeNull();
  const rowsA = await a.from("apartments").select("id");
  const rowsB = await b.from("apartments").select("id");
  expect(rowsA.error).toBeNull();
  expect(rowsB.error).toBeNull();
  const idsA = new Set((rowsA.data ?? []).map((row) => row.id));
  expect((rowsB.data ?? []).some((row) => idsA.has(row.id))).toBe(false);
});
