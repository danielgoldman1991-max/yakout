import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { launchAirbnbBrowser, resolveBrowserLaunchOptions, isVercelRuntime } from "../lib/airbnb/browser.server";

const require = createRequire(import.meta.url);
async function main() {
 const started = Date.now();
 let handle: Awaited<ReturnType<typeof launchAirbnbBrowser>> | null = null;
 try {
  const resolved = await resolveBrowserLaunchOptions();
  const sparticuzVersion = JSON.parse(await readFile(new URL("../node_modules/@sparticuz/chromium/package.json", import.meta.url), "utf8")).version;
  console.log({ environment: isVercelRuntime() ? "vercel" : "local", platform: process.platform, arch: process.arch, node: process.version, playwrightCore: require("playwright-core/package.json").version, sparticuzChromium: sparticuzVersion, executablePath: resolved.executablePath, executableExists: await access(resolved.executablePath).then(() => true, () => false) });
  handle = await launchAirbnbBrowser();
  const page = await handle.browser.newPage();
  const response = await page.goto("https://example.com", { waitUntil: "domcontentloaded", timeout: 30_000 });
  console.log({ browserLaunch: true, exampleStatus: response?.status(), exampleTitle: await page.title(), totalMs: Date.now() - started });
} catch (error) {
  console.error({ name: error instanceof Error ? error.name : undefined, message: error instanceof Error ? error.message : String(error), cause: error instanceof Error && "cause" in error ? String(error.cause) : undefined, stack: error instanceof Error ? error.stack : undefined, totalMs: Date.now() - started });
  process.exitCode = 1;
 } finally { if (handle) await handle.cleanup(); }
}
void main();
