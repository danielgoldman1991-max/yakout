import { expect, test } from "@playwright/test";
import { dataFailure, dataSuccess } from "../../lib/data/result";

test("une liste vide réussie est distincte d'une panne", () => {
  expect(dataSuccess([])).toEqual({ ok: true, data: [], source: "supabase" });
  const failed = dataFailure({ code: "PGRST000", message: "secret database detail" });
  expect(failed.ok).toBe(false);
  if (!failed.ok) expect(failed.error.message).not.toContain("secret database detail");
});
