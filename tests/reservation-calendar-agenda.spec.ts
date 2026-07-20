import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
test("agenda opérationnel accessible",async({page})=>{await openReservationCalendar(page,"?view=agenda&from=2026-07-20&to=2026-07-27");await expect(page.getByRole("link",{name:"Agenda"})).toBeVisible();});
