import { expect, test } from "@playwright/test";
test("une panne ne produit pas de disponibilité fictive",async({page})=>{await page.route("**/dashboard/reservations/calendar**",route=>route.abort());await page.goto("/dashboard/reservations/calendar").catch(()=>{});await expect(page.getByText("Disponibles")).toHaveCount(0);});
