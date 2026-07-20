import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("structure accessible essentielle",async({page})=>{await openReservationCalendar(page);await expect(page.getByRole("heading",{level:1})).toHaveCount(1);await expect(page.getByRole("navigation",{name:"Modes du calendrier"})).toBeVisible();await expect(page.getByLabel("Légende")).toBeVisible();});
