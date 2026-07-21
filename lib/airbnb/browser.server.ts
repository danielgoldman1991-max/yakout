import "server-only";

import crypto from "node:crypto";
import { access, rm } from "node:fs/promises";
import path from "node:path";
import sparticuzChromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type Browser, type LaunchOptions } from "playwright-core";
import { AirbnbImportError } from "./errors";

export const isVercelRuntime = () => process.env.VERCEL === "1" || Boolean(process.env.AWS_EXECUTION_ENV) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const exists = async (candidate?: string) => candidate ? access(candidate).then(() => true, () => false) : false;

function localCandidates() {
  const env = process.env;
  if (process.platform === "win32") return [
    env.AIRBNB_BROWSER_EXECUTABLE_PATH,
    env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    playwrightChromium.executablePath(),
    env.PROGRAMFILES && path.join(env.PROGRAMFILES, "Google", "Chrome", "Application", "chrome.exe"),
    env["PROGRAMFILES(X86)"] && path.join(env["PROGRAMFILES(X86)"]!, "Google", "Chrome", "Application", "chrome.exe"),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    env.PROGRAMFILES && path.join(env.PROGRAMFILES, "Microsoft", "Edge", "Application", "msedge.exe"),
    env["PROGRAMFILES(X86)"] && path.join(env["PROGRAMFILES(X86)"]!, "Microsoft", "Edge", "Application", "msedge.exe"),
  ];
  return [env.AIRBNB_BROWSER_EXECUTABLE_PATH, env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, playwrightChromium.executablePath(), "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
}

export async function resolveBrowserLaunchOptions(): Promise<{ runtime: "local" | "vercel"; executablePath: string; options: LaunchOptions; userDataDir: string }> {
  const runtime = isVercelRuntime() ? "vercel" : "local";
  const started = Date.now();
  let executablePath: string | undefined;
  let args: string[] = [];
  if (runtime === "vercel") {
    sparticuzChromium.setGraphicsMode = false;
    executablePath = await sparticuzChromium.executablePath();
    args = [...sparticuzChromium.args];
  } else {
    for (const candidate of localCandidates()) if (candidate && await exists(candidate)) { executablePath = candidate; break; }
  }
  if (!executablePath) {
    console.error("[airbnb-import] local browser missing. Run: npx playwright install chromium");
    throw new AirbnbImportError("AIRBNB_LOCAL_BROWSER_MISSING", "No local Chromium, Chrome or Edge executable exists. Run: npx playwright install chromium", "browser-resolution", 503, false);
  }
  if (!await exists(executablePath)) throw new AirbnbImportError("AIRBNB_BROWSER_BINARY_MISSING", `Browser binary does not exist: ${executablePath}`, "browser-resolution", 503, true);
  const userDataDir = runtime === "vercel" ? `/tmp/yakout-pw-${crypto.randomUUID()}` : path.join(process.env.TEMP ?? process.cwd(), `yakout-pw-${crypto.randomUUID()}`);
  console.info("[airbnb-import] browser executable resolved", { runtime, platform: process.platform, arch: process.arch, executablePath, exists: true, durationMs: Date.now() - started });
  // Playwright 1.61 rejects --user-data-dir with launch(); it creates and cleans
  // its own isolated profile. We still reserve a scoped directory for ancillary
  // runtime files and remove it during cleanup.
  return { runtime, executablePath, userDataDir, options: { executablePath, args, headless: true } };
}

export async function launchAirbnbBrowser(): Promise<{ browser: Browser; runtime: "local" | "vercel"; executablePath: string; userDataDir: string; cleanup: () => Promise<void> }> {
  const resolved = await resolveBrowserLaunchOptions();
  const started = Date.now();
  let browser: Browser;
  try { browser = await playwrightChromium.launch(resolved.options); }
  catch (cause) { throw new AirbnbImportError("AIRBNB_BROWSER_LAUNCH_FAILED", cause instanceof Error ? cause.message : String(cause), "browser-launch", 503, true, { cause }); }
  console.info("[airbnb-import] browser launched", { runtime: resolved.runtime, durationMs: Date.now() - started });
  return { ...resolved, browser, cleanup: async () => {
    console.info("[airbnb-import] browser cleanup started", { runtime: resolved.runtime });
    for (const context of browser.contexts()) for (const page of context.pages()) await page.close().catch(() => undefined);
    await Promise.race([browser.close(), new Promise<void>((resolve) => setTimeout(resolve, 5_000))]).catch(() => undefined);
    await rm(resolved.userDataDir, { recursive: true, force: true }).catch(() => undefined);
    console.info("[airbnb-import] browser cleanup completed", { runtime: resolved.runtime });
  } };
}
