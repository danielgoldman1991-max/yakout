import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("KPI conflits toujours présent",async({page})=>{await openReservationCalendar(page);await expect(page.getByText("Conflits",{exact:true})).toBeVisible();});
