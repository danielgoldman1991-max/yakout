import { chromium } from "playwright-core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((arg, index, all) => arg.startsWith("--") ? [arg.slice(2), all[index + 1]?.startsWith("--") ? true : all[index + 1] ?? true] : null).filter(Boolean));
const url = String(args.url ?? "");
if (!/^https:\/\/(?:[a-z-]+\.)?airbnb\.(?:com|fr)\/rooms\/\d+/.test(url)) throw new Error("Cette URL ne correspond pas à une annonce Airbnb valide.");
if (args.confirm && !args["owner-id"]) throw new Error("--owner-id est obligatoire avec --confirm.");
if (args.confirm) throw new Error("L’import confirmé doit passer par le workflow dashboard authentifié ; la CLI reste en dry-run tant que la migration et le propriétaire ne sont pas vérifiés.");
const id = new URL(url).pathname.match(/\/rooms\/(\d+)/)?.[1];
const root = path.resolve("airbnb-import-artifacts"); await mkdir(path.join(root, "raw"), { recursive: true }); await mkdir(path.join(root, "screenshots"), { recursive: true }); await mkdir(path.join(root, "reports"), { recursive: true });
const browser = await chromium.launch({ headless: process.env.AIRBNB_IMPORT_VISIBLE !== "true" });
try {
  const page = await browser.newPage({ locale: "fr-FR", timezoneId: "Africa/Casablanca", viewport: { width: 1440, height: 1000 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }); await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  const text = await page.locator("body").innerText(); if (/captcha|verify you are human|confirmez que vous êtes humain/i.test(text)) throw new Error("Intervention humaine requise : relancez avec AIRBNB_IMPORT_VISIBLE=true.");
  const snapshot = await page.evaluate(() => ({ title: document.querySelector("h1")?.textContent?.trim() ?? document.title, language: document.documentElement.lang, photos: [...document.images].map((image) => image.currentSrc || image.src).filter((src) => /muscache|airbnb/i.test(src)), text: document.body.innerText }));
  await writeFile(path.join(root, "raw", "page.html"), await page.content()); await writeFile(path.join(root, "raw", "page.json"), JSON.stringify({ listingId: id, url, ...snapshot }, null, 2)); await page.screenshot({ path: path.join(root, "screenshots", "full-page.png"), fullPage: true });
  const report = `# Import Airbnb — aperçu\n\n- Listing ID : ${id}\n- Titre : ${snapshot.title}\n- Photos détectées : ${new Set(snapshot.photos).size}\n- Mode : dry-run\n- Écriture Supabase : aucune\n`;
  await writeFile(path.join(root, "reports", "extraction-report.md"), report); await writeFile(path.join(root, "reports", "extraction-report.json"), JSON.stringify({ listingId: id, title: snapshot.title, photoCount: new Set(snapshot.photos).size, dryRun: true }, null, 2)); console.log(report);
} finally { await browser.close(); }
