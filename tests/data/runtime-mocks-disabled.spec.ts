import { expect, test } from "@playwright/test";
import fs from "node:fs";

test("les erreurs runtime ne retournent plus le fallback fictif", () => {
  const source = fs.readFileSync("lib/data/index.ts", "utf8");
  expect(source).toContain("throw new Error(`DATA_UNAVAILABLE:${entity}`)");
  expect(source).not.toContain("retour de secours utilise");
});
