import { expect, test } from "@playwright/test";
import { openReservationCalendar } from "./helpers/reservation-calendar";
for(const width of [360,390,430,768,1024,1440,1920])test(`sans débordement global à ${width}px`,async({page})=>{await page.setViewportSize({width,height:width<700?844:1000});await openReservationCalendar(page);const size=await page.evaluate(()=>({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth}));expect(size.s).toBeLessThanOrEqual(size.c+1);});
