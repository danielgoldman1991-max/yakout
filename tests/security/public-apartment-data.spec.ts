import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sensitiveColumns = [
  "address_private", "exact_address", "wifi_password", "access_code",
  "access_instructions", "internal_notes", "owner_notes", "commission_rate",
  "management_fee", "owner_id", "documents", "bank_name", "rib",
];

test("le rôle anonyme ne peut lire aucune colonne privée d'appartement", async () => {
  expect(url, "NEXT_PUBLIC_SUPABASE_URL requis pour la preuve réelle").toBeTruthy();
  expect(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY requis pour la preuve réelle").toBeTruthy();
  const client = createClient(url!, anonKey!, { auth: { persistSession: false } });

  for (const column of sensitiveColumns) {
    const { error } = await client.from("apartments").select(`id, ${column}`).limit(1);
    expect(error, `La colonne privée ${column} ne doit pas être lisible`).toBeTruthy();
  }

  const { data, error } = await client.from("public_apartments_v").select("*").limit(20);
  expect(error, "La vue publique sécurisée doit être déployée").toBeNull();
  for (const row of data ?? []) {
    expect(row.is_published).toBe(true);
    for (const column of sensitiveColumns) expect(row).not.toHaveProperty(column);
  }
});

test("le loader public ne référence plus la table de base", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile("lib/data/index.ts", "utf8"));
  for (const functionName of ["getPublishedApartments", "getPublicApartments", "getApartmentBySlug"]) {
    const start = source.indexOf(`export async function ${functionName}`);
    const end = source.indexOf("\nexport ", start + 1);
    const body = source.slice(start, end === -1 ? undefined : end);
    expect(body).toContain('.from("public_apartments_v")');
    expect(body).not.toContain('.from("apartments")');
    expect(body).not.toContain("mockApartments");
  }
});
