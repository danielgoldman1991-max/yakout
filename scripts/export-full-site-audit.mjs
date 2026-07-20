import { chromium } from "playwright-core";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = "https://yakout-three.vercel.app";
const OUT_DIR = path.resolve("site-audit-export");
const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x900", width: 1024, height: 900 },
  { name: "1440x1000", width: 1440, height: 1000 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

const BASE_ROUTES = [
  "/",
  "/apartments",
  "/transport",
  "/vehicles",
  "/packages",
  "/services",
  "/blog",
  "/contact",
  "/contact?type=reservation",
  "/contact?type=transport",
  "/contact?type=package",
  "/contact?type=proprietaire",
  "/proprietaires",
  "/login",
];

const DYNAMIC_TARGETS = [
  { label: "première fiche appartement", route: "/apartments", pattern: /^\/apartments\/[^/?#]+/ },
  { label: "première fiche package", route: "/packages", pattern: /^\/packages\/[^/?#]+/ },
  { label: "premier article de blog", route: "/blog", pattern: /^\/blog\/[^/?#]+/ },
  { label: "première fiche véhicule publique", route: "/vehicles", pattern: /^\/vehicles\/[^/?#]+/ },
];

const reports = {
  pages: [],
  links: [],
  buttons: [],
  images: [],
  consoleErrors: [],
  failedRequests: [],
  metadata: [],
  responsive: [],
  accessibility: [],
  interactions: [],
  forms: [],
  darkMode: [],
  notTestable: [],
};

const routeStatusCache = new Map();

function urlForRoute(route) {
  return new URL(route, BASE_URL).toString();
}

function slugify(value) {
  return value
    .replace(/^https?:\/\//, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "home";
}

function routeFileSlug(route, viewport, theme) {
  return `${slugify(route === "/" ? "home" : route)}-${viewport.name}-${theme}`;
}

function sameSiteHttpLink(href) {
  if (!href) return null;
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("sms:") || href.startsWith("whatsapp:")) return null;
  try {
    const url = new URL(href, BASE_URL);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.hostname !== new URL(BASE_URL).hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isInvalidHref(href) {
  if (href == null) return true;
  const trimmed = String(href).trim();
  return trimmed === "" || trimmed === "#" || trimmed.toLowerCase().startsWith("javascript:");
}

function textPreview(value, max = 140) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function ensureOutput() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(path.join(OUT_DIR, "screenshots", "light"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "screenshots", "dark"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "html"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "reports"), { recursive: true });
}

async function writeJson(name, data) {
  await writeFile(path.join(OUT_DIR, "reports", name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function newContext(browser, viewport, theme) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });

  await context.addInitScript((selectedTheme) => {
    window.localStorage.setItem("yakout-theme", selectedTheme);
    document.documentElement.classList.toggle("dark", selectedTheme === "dark");
    document.documentElement.classList.toggle("light", selectedTheme === "light");
  }, theme);

  return context;
}

async function discoverDynamicRoutes(browser) {
  const dynamicRoutes = new Set();

  const context = await newContext(browser, VIEWPORTS[3], "light");
  const page = await context.newPage();

  for (const target of DYNAMIC_TARGETS) {
    try {
      await page.goto(urlForRoute(target.route), { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
      const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll("a[href]"), (a) => a.getAttribute("href")));
      const match = hrefs
        .map((href) => {
          try {
            const url = new URL(href, window.location.origin);
            return `${url.pathname}${url.search}`;
          } catch {
            return "";
          }
        })
        .find((href) => target.pattern.test(href) && !href.startsWith("/dashboard"));

      if (match) {
        dynamicRoutes.add(match);
      }
    } catch (error) {
      reports.consoleErrors.push({
        route: target.route,
        viewport: "discovery",
        theme: "light",
        type: "dynamic-route-discovery",
        text: error.message,
      });
    }
  }

  await context.close();
  return [...dynamicRoutes];
}

function discoverDynamicRoutesFromCollectedLinks(existingRoutes) {
  const known = new Set(existingRoutes);
  const discovered = new Set();

  for (const target of DYNAMIC_TARGETS) {
    const match = reports.links
      .map((link) => {
        try {
          const url = new URL(link.resolvedHref || link.href, BASE_URL);
          return `${url.pathname}${url.search}`;
        } catch {
          return "";
        }
      })
      .find((href) => target.pattern.test(href) && !href.startsWith("/dashboard") && !known.has(href));

    if (match) {
      discovered.add(match);
      known.add(match);
    }
  }

  return [...discovered];
}

function addMissingDynamicNotTestable(routes) {
  for (const target of DYNAMIC_TARGETS) {
    const found = routes.some((route) => target.pattern.test(route));
    if (!found) {
      reports.notTestable.push({
        route: target.route,
        check: "dynamic-route-discovery",
        reason: `${target.label} non détectée sur le site de production.`,
      });
    }
  }
}

async function checkRouteStatus(context, href, sourceRoute) {
  const key = href.split("#")[0];
  if (routeStatusCache.has(key)) return routeStatusCache.get(key);

  const result = {
    url: key,
    sourceRoute,
    status: null,
    ok: false,
    error: null,
  };

  try {
    const response = await context.request.get(key, {
      maxRedirects: 5,
      timeout: 20000,
      failOnStatusCode: false,
    });
    result.status = response.status();
    result.finalUrl = response.url();
    result.ok = result.status < 400;
  } catch (error) {
    result.error = error.message;
  }

  routeStatusCache.set(key, result);
  return result;
}

async function extractPageData(page, route, viewport, theme) {
  return page.evaluate(
    ({ route, viewportName, theme }) => {
      const isVisible = (el) => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      };

      const parseColor = (value) => {
        const match = String(value).match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
        if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
      };

      const luminance = (color) => {
        const convert = (channel) => {
          const c = channel / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * convert(color.r) + 0.7152 * convert(color.g) + 0.0722 * convert(color.b);
      };

      const contrastRatio = (fg, bg) => {
        if (!fg || !bg || fg.a === 0 || bg.a === 0) return null;
        const l1 = luminance(fg);
        const l2 = luminance(bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };

      const effectiveBackground = (el) => {
        let current = el;
        while (current && current !== document.documentElement) {
          const color = parseColor(window.getComputedStyle(current).backgroundColor);
          if (color && color.a > 0.15) return color;
          current = current.parentElement;
        }
        return parseColor(window.getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
      };

      const rectData = (el) => {
        const rect = el.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };

      const metaContent = (selector) => document.querySelector(selector)?.getAttribute("content") || "";
      const headings = Array.from(document.querySelectorAll("h1,h2,h3"), (el) => ({
        level: el.tagName.toLowerCase(),
        text: el.textContent?.replace(/\s+/g, " ").trim() || "",
      }));
      const h1 = headings.filter((heading) => heading.level === "h1");

      const links = Array.from(document.querySelectorAll("a"), (el) => {
        const href = el.getAttribute("href");
        return {
          route,
          viewport: viewportName,
          theme,
          text: el.textContent?.replace(/\s+/g, " ").trim() || el.getAttribute("aria-label") || "",
          href,
          resolvedHref: href ? new URL(href, window.location.href).toString() : "",
          visible: isVisible(el),
          rect: rectData(el),
          target: el.getAttribute("target") || "",
        };
      });

      const buttons = Array.from(document.querySelectorAll("button,[role='button'],input[type='button'],input[type='submit']"), (el) => ({
        route,
        viewport: viewportName,
        theme,
        text: el.textContent?.replace(/\s+/g, " ").trim() || el.getAttribute("aria-label") || el.getAttribute("value") || "",
        type: el.getAttribute("type") || el.tagName.toLowerCase(),
        disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true",
        visible: isVisible(el),
        rect: rectData(el),
      }));

      const images = Array.from(document.images, (img) => ({
        route,
        viewport: viewportName,
        theme,
        src: img.currentSrc || img.src || img.getAttribute("src") || "",
        alt: img.getAttribute("alt"),
        visible: isVisible(img),
        broken: img.complete && img.naturalWidth === 0,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        rect: rectData(img),
      }));

      const invalidHrefIssues = links
        .filter((link) => {
          const href = String(link.href ?? "").trim();
          return href === "" || href === "#" || href.toLowerCase().startsWith("javascript:");
        })
        .map((link) => ({ route, viewport: viewportName, theme, issue: "invalid-href", text: link.text, href: link.href }));

      const horizontalOverflow = {
        route,
        viewport: viewportName,
        theme,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth,
        hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        elements: Array.from(document.body.querySelectorAll("*"))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.right > window.innerWidth + 1 || rect.left < -1;
          })
          .slice(0, 30)
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 90) || "",
            className: String(el.className || "").slice(0, 140),
            rect: rectData(el),
          })),
      };

      const smallText = Array.from(document.body.querySelectorAll("*"))
        .filter((el) => isVisible(el) && (el.textContent || "").trim())
        .map((el) => {
          const style = window.getComputedStyle(el);
          return {
            route,
            viewport: viewportName,
            theme,
            tag: el.tagName.toLowerCase(),
            text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 100) || "",
            fontSize: Number.parseFloat(style.fontSize),
            rect: rectData(el),
          };
        })
        .filter((item) => item.fontSize > 0 && item.fontSize < 12)
        .slice(0, 80);

      const smallInteractive = Array.from(document.querySelectorAll("a,button,input,select,textarea,[role='button'],[tabindex]"))
        .filter((el) => isVisible(el) && !el.disabled)
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width < 44 || rect.height < 44)
        .slice(0, 80)
        .map(({ el, rect }) => ({
          route,
          viewport: viewportName,
          theme,
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.replace(/\s+/g, " ").trim().slice(0, 100) || el.getAttribute("aria-label") || el.getAttribute("name") || "",
          href: el.getAttribute("href") || "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }));

      const lowContrast = Array.from(document.body.querySelectorAll("a,button,p,span,li,label,h1,h2,h3,input,textarea,select"))
        .filter((el) => isVisible(el) && (el.textContent || el.getAttribute("placeholder") || "").trim())
        .map((el) => {
          const style = window.getComputedStyle(el);
          const ratio = contrastRatio(parseColor(style.color), effectiveBackground(el));
          return {
            route,
            viewport: viewportName,
            theme,
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim().slice(0, 100),
            ratio: ratio ? Number(ratio.toFixed(2)) : null,
            fontSize: Number.parseFloat(style.fontSize),
            color: style.color,
            backgroundColor: window.getComputedStyle(el).backgroundColor,
          };
        })
        .filter((item) => item.ratio != null && item.ratio < 3)
        .slice(0, 80);

      const entityText = Array.from(document.body.querySelectorAll("*"))
        .map((el) => el.childNodes.length === 1 ? el.textContent || "" : "")
        .filter((text) => /&(?:apos|quot|thinsp|nbsp|amp|eacute|agrave);/i.test(text))
        .slice(0, 80)
        .map((text) => ({ route, viewport: viewportName, theme, text: text.replace(/\s+/g, " ").trim().slice(0, 180) }));

      const metadata = {
        route,
        viewport: viewportName,
        theme,
        title: document.title,
        description: document.querySelector("meta[name='description']")?.getAttribute("content") || "",
        canonical: document.querySelector("link[rel='canonical']")?.getAttribute("href") || "",
        openGraph: {
          title: metaContent("meta[property='og:title']"),
          description: metaContent("meta[property='og:description']"),
          url: metaContent("meta[property='og:url']"),
          image: metaContent("meta[property='og:image']"),
          type: metaContent("meta[property='og:type']"),
        },
        twitter: {
          card: metaContent("meta[name='twitter:card']"),
          title: metaContent("meta[name='twitter:title']"),
          description: metaContent("meta[name='twitter:description']"),
          image: metaContent("meta[name='twitter:image']"),
        },
        hasLocalhost: /localhost|127\.0\.0\.1/i.test(document.head.innerHTML),
        h1Count: h1.length,
        headingHierarchy: headings,
      };

      const forms = Array.from(document.forms, (form) => ({
        route,
        viewport: viewportName,
        theme,
        id: form.id || "",
        name: form.getAttribute("name") || "",
        action: form.getAttribute("action") || "",
        method: form.getAttribute("method") || "get",
        fields: Array.from(form.querySelectorAll("input,select,textarea"), (field) => ({
          tag: field.tagName.toLowerCase(),
          type: field.getAttribute("type") || "",
          name: field.getAttribute("name") || "",
          placeholder: field.getAttribute("placeholder") || "",
          required: field.hasAttribute("required"),
          ariaLabel: field.getAttribute("aria-label") || "",
          label: field.id ? document.querySelector(`label[for='${CSS.escape(field.id)}']`)?.textContent?.replace(/\s+/g, " ").trim() || "" : "",
          validationMessage: field.validationMessage || "",
        })),
      }));

      const whatsapp = Array.from(document.querySelectorAll("a[href*='wa.me'],a[href*='whatsapp']"));
      const ctas = Array.from(document.querySelectorAll("a,button"))
        .filter((el) => isVisible(el) && !whatsapp.includes(el))
        .filter((el) => /réserver|reserver|demander|contact|confier|pack|devis|whatsapp/i.test(el.textContent || el.getAttribute("aria-label") || ""));
      const whatsappOverlap = [];
      for (const wa of whatsapp) {
        const a = wa.getBoundingClientRect();
        for (const cta of ctas) {
          const b = cta.getBoundingClientRect();
          const overlaps = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
          if (overlaps) {
            whatsappOverlap.push({
              route,
              viewport: viewportName,
              theme,
              whatsappText: wa.textContent?.replace(/\s+/g, " ").trim() || wa.getAttribute("aria-label") || "",
              ctaText: cta.textContent?.replace(/\s+/g, " ").trim() || cta.getAttribute("aria-label") || "",
              whatsappRect: rectData(wa),
              ctaRect: rectData(cta),
            });
          }
        }
      }

      return {
        links,
        buttons,
        images,
        metadata,
        responsive: [horizontalOverflow],
        accessibility: [...invalidHrefIssues, ...smallText.map((item) => ({ issue: "small-text", ...item })), ...smallInteractive.map((item) => ({ issue: "small-interactive", ...item })), ...lowContrast.map((item) => ({ issue: "low-contrast-possible", ...item }))],
        entityText,
        forms,
        whatsappOverlap,
      };
    },
    { route, viewportName: viewport.name, theme },
  );
}

async function testInteractions(page, route, viewport, theme) {
  const results = [];

  async function safeStep(name, fn) {
    try {
      results.push({ route, viewport: viewport.name, theme, check: name, ...(await fn()) });
    } catch (error) {
      results.push({ route, viewport: viewport.name, theme, check: name, ok: false, error: error.message });
    }
  }

  await safeStep("mobile-menu-open-close", async () => {
    const menuButton = page.getByRole("button", { name: /ouvrir le menu|fermer le menu/i }).first();
    if (await menuButton.count() === 0) return { ok: false, skipped: true, reason: "Bouton menu mobile absent." };
    await menuButton.click({ timeout: 3000 });
    await page.waitForTimeout(300);
    const openVisible = await page.locator("#mobile-menu,[aria-label='Navigation mobile']").first().isVisible().catch(() => false);
    const closeButton = page.getByRole("button", { name: /fermer le menu/i }).first();
    if (await closeButton.count()) await closeButton.click({ timeout: 3000 });
    await page.waitForTimeout(250);
    const closed = !(await page.locator("#mobile-menu,[aria-label='Navigation mobile']").first().isVisible().catch(() => false));
    return { ok: openVisible && closed, openVisible, closed };
  });

  await safeStep("theme-switch", async () => {
    const before = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      light: document.documentElement.classList.contains("light"),
      stored: localStorage.getItem("yakout-theme"),
    }));
    const toggle = page.getByRole("button", { name: /activer le mode clair|activer le mode sombre/i }).first();
    if (await toggle.count() === 0) return { ok: false, skipped: true, reason: "ThemeToggle absent." };
    await toggle.click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({
      dark: document.documentElement.classList.contains("dark"),
      light: document.documentElement.classList.contains("light"),
      stored: localStorage.getItem("yakout-theme"),
    }));
    return { ok: before.stored !== after.stored || before.dark !== after.dark || before.light !== after.light, before, after };
  });

  await safeStep("selects-dropdowns-open", async () => {
    const nativeSelects = await page.locator("select").count();
    const radixTriggers = await page.locator("[role='combobox']").count();
    const dropdownTriggers = await page.locator("[data-radix-collection-item],button[aria-haspopup='menu']").count();
    const opened = [];

    for (let i = 0; i < Math.min(radixTriggers, 8); i += 1) {
      const trigger = page.locator("[role='combobox']").nth(i);
      if (!(await trigger.isVisible().catch(() => false))) continue;
      await trigger.click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(200);
      opened.push({
        index: i,
        popupVisible: await page.locator("[role='listbox'],[data-radix-popper-content-wrapper]").first().isVisible().catch(() => false),
        text: await trigger.innerText().catch(() => ""),
      });
      await page.keyboard.press("Escape").catch(() => {});
    }

    return { ok: nativeSelects + radixTriggers + dropdownTriggers > 0, nativeSelects, radixTriggers, dropdownTriggers, opened };
  });

  await safeStep("filter-tous-les-quartiers", async () => {
    const candidates = [
      page.getByText("Tous les quartiers", { exact: false }).first(),
      page.getByRole("combobox").filter({ hasText: /Tous les quartiers/i }).first(),
    ];
    for (const candidate of candidates) {
      if ((await candidate.count()) > 0 && (await candidate.isVisible().catch(() => false))) {
        await candidate.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        const popupVisible = await page.locator("[role='listbox'],[data-radix-popper-content-wrapper],option").first().isVisible().catch(() => false);
        await page.keyboard.press("Escape").catch(() => {});
        return { ok: true, found: true, popupVisible };
      }
    }
    return { ok: false, skipped: true, found: false, reason: "Filtre Tous les quartiers absent sur cette route." };
  });

  await safeStep("form-validation-errors", async () => {
    await page.evaluate(() => {
      window.__yakoutAuditSubmitEvents = [];
      document.querySelectorAll("form").forEach((form) => {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          window.__yakoutAuditSubmitEvents.push({
            id: form.id || "",
            action: form.getAttribute("action") || "",
            valid: form.checkValidity(),
          });
        }, { capture: true });
      });
    });

    const submitButtons = page.locator("form button[type='submit'], form input[type='submit']");
    const count = await submitButtons.count();
    for (let i = 0; i < Math.min(count, 3); i += 1) {
      const button = submitButtons.nth(i);
      if (await button.isVisible().catch(() => false)) {
        await button.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(250);
      }
    }

    const messages = await page.evaluate(() => ({
      submitEvents: window.__yakoutAuditSubmitEvents || [],
      invalidFields: Array.from(document.querySelectorAll("input,select,textarea"))
        .filter((field) => !field.checkValidity())
        .map((field) => ({
          name: field.getAttribute("name") || "",
          type: field.getAttribute("type") || field.tagName.toLowerCase(),
          required: field.hasAttribute("required"),
          validationMessage: field.validationMessage || "",
        })),
      visibleErrorText: Array.from(document.querySelectorAll("[role='alert'],.text-red-400,.text-red-500,.text-destructive"))
        .map((el) => el.textContent?.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    }));

    return { ok: true, formCount: await page.locator("form").count(), submitButtonCount: count, ...messages };
  });

  return results;
}

async function auditRoute(browser, route, viewport, theme) {
  const context = await newContext(browser, viewport, theme);
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      consoleErrors.push({
        route,
        viewport: viewport.name,
        theme,
        type: message.type(),
        text: message.text(),
        location: message.location(),
      });
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push({
      route,
      viewport: viewport.name,
      theme,
      type: "pageerror",
      text: error.message,
      stack: error.stack,
    });
  });

  page.on("requestfailed", (request) => {
    failedRequests.push({
      route,
      viewport: viewport.name,
      theme,
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      failure: request.failure()?.errorText || "",
    });
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      failedRequests.push({
        route,
        viewport: viewport.name,
        theme,
        url: response.url(),
        method: response.request().method(),
        resourceType: response.request().resourceType(),
        status,
        statusText: response.statusText(),
      });
    }
  });

  const pageReport = {
    route,
    viewport: viewport.name,
    theme,
    targetUrl: urlForRoute(route),
    finalUrl: null,
    status: null,
    ok: false,
    error: null,
    screenshot: null,
    html: null,
  };

  try {
    const response = await page.goto(urlForRoute(route), { waitUntil: "domcontentloaded", timeout: 60000 });
    pageReport.status = response?.status() ?? null;
    pageReport.finalUrl = page.url();
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    const data = await extractPageData(page, route, viewport, theme);
    reports.links.push(...data.links);
    reports.buttons.push(...data.buttons);
    reports.images.push(...data.images);
    reports.metadata.push(data.metadata);
    reports.responsive.push(...data.responsive, ...data.whatsappOverlap.map((item) => ({ issue: "whatsapp-overlap", ...item })));
    reports.accessibility.push(...data.accessibility, ...data.entityText.map((item) => ({ issue: "visible-html-entity", ...item })));
    reports.forms.push(...data.forms);

    const interactionResults = await testInteractions(page, route, viewport, theme);
    reports.interactions.push(...interactionResults);
    reports.darkMode.push(...interactionResults.filter((item) => item.check === "theme-switch"));

    const fileSlug = routeFileSlug(route, viewport, theme);
    const screenshotPath = path.join(OUT_DIR, "screenshots", theme, `${fileSlug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 45000 });
    pageReport.screenshot = path.relative(OUT_DIR, screenshotPath).replaceAll("\\", "/");

    const htmlPath = path.join(OUT_DIR, "html", `${fileSlug}.html`);
    await writeFile(htmlPath, await page.content(), "utf8");
    pageReport.html = path.relative(OUT_DIR, htmlPath).replaceAll("\\", "/");
    pageReport.ok = (pageReport.status ?? 999) < 400;
  } catch (error) {
    pageReport.error = error.message;
  } finally {
    reports.consoleErrors.push(...consoleErrors);
    reports.failedRequests.push(...failedRequests);
    reports.pages.push(pageReport);
    await context.close();
  }
}

async function verifyLinks(browser) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const unique = new Map();

  for (const link of reports.links) {
    if (isInvalidHref(link.href)) {
      unique.set(`${link.route}|invalid|${link.text}|${link.href}`, {
        sourceRoute: link.route,
        text: link.text,
        href: link.href,
        invalid: true,
        reason: "href vide, # ou javascript:",
      });
      continue;
    }

    const resolved = sameSiteHttpLink(link.resolvedHref || link.href);
    if (!resolved) continue;
    if (!unique.has(resolved)) {
      unique.set(resolved, {
        sourceRoute: link.route,
        text: link.text,
        href: link.href,
        resolvedHref: resolved,
      });
    }
  }

  const checked = [];
  for (const item of unique.values()) {
    if (item.invalid) {
      checked.push(item);
      continue;
    }
    checked.push({ ...item, ...(await checkRouteStatus(context, item.resolvedHref, item.sourceRoute)) });
  }

  await context.close();
  return checked;
}

function countIssues() {
  const pageErrors = reports.pages.filter((page) => !page.ok);
  const brokenLinks = reports.links.filter((link) => link.status >= 400 || link.invalid || link.error);
  const brokenImages = reports.images.filter((image) => image.broken);
  const missingAlt = reports.images.filter((image) => image.visible && (image.alt == null || image.alt.trim() === ""));
  const seoIssues = reports.metadata.filter((meta) => !meta.title || !meta.description || !meta.canonical || meta.hasLocalhost || meta.h1Count !== 1);
  const responsiveIssues = reports.responsive.filter((item) => item.hasOverflow || item.issue === "whatsapp-overlap");
  const accessibilityIssues = reports.accessibility.filter((item) => ["invalid-href", "small-text", "small-interactive", "low-contrast-possible", "visible-html-entity"].includes(item.issue));
  const darkModeIssues = reports.darkMode.filter((item) => !item.ok && !item.skipped);

  return {
    pageErrors,
    brokenLinks,
    brokenImages,
    missingAlt,
    seoIssues,
    responsiveIssues,
    accessibilityIssues,
    darkModeIssues,
  };
}

async function writeSummary(routes, linkChecks) {
  const routesTested = [...new Set(reports.pages.map((page) => page.route))];
  const successRoutes = [...new Set(reports.pages.filter((page) => page.ok).map((page) => page.route))];
  const errorRoutes = [...new Set(reports.pages.filter((page) => !page.ok).map((page) => page.route))];
  const brokenLinks = linkChecks.filter((link) => link.invalid || link.error || (link.status ?? 0) >= 400);
  const brokenImages = reports.images.filter((image) => image.broken);
  const seoIssues = reports.metadata.filter((meta) => !meta.title || !meta.description || !meta.canonical || meta.hasLocalhost || meta.h1Count !== 1);
  const responsiveIssues = reports.responsive.filter((item) => item.hasOverflow || item.issue === "whatsapp-overlap");
  const accessibilityIssues = reports.accessibility.filter((item) => ["invalid-href", "small-text", "small-interactive", "low-contrast-possible", "visible-html-entity"].includes(item.issue));
  const darkModeIssues = reports.darkMode.filter((item) => !item.ok && !item.skipped);

  const bulletList = (items, formatter, empty = "Aucun.") => {
    if (!items.length) return `- ${empty}`;
    return items.slice(0, 80).map((item) => `- ${formatter(item)}`).join("\n");
  };

  const summary = `# Yakout Full Site Audit

Production audit: ${BASE_URL}
Generated: ${new Date().toISOString()}

## Routes testées
${routes.map((route) => `- ${route}`).join("\n")}

## Routes réussies
${successRoutes.map((route) => `- ${route}`).join("\n") || "- Aucune."}

## Routes en erreur
${errorRoutes.map((route) => `- ${route}`).join("\n") || "- Aucune."}

## Liens cassés
${bulletList(brokenLinks, (link) => `${link.sourceRoute || "?"} -> ${link.resolvedHref || link.href || "(vide)"} ${link.status ? `(HTTP ${link.status})` : ""}${link.reason ? ` - ${link.reason}` : ""}${link.error ? ` - ${link.error}` : ""}`)}

## Images cassées
${bulletList(brokenImages, (image) => `${image.route} (${image.viewport}/${image.theme}) -> ${image.src}`)}

## Erreurs console
${bulletList(reports.consoleErrors, (error) => `${error.route} (${error.viewport}/${error.theme}) [${error.type}] ${textPreview(error.text, 220)}`)}

## Erreurs réseau
${bulletList(reports.failedRequests, (request) => `${request.route} (${request.viewport}/${request.theme}) ${request.status || request.failure || ""} ${request.url}`)}

## Problèmes SEO
${bulletList(seoIssues, (meta) => `${meta.route} (${meta.viewport}/${meta.theme}) title=${Boolean(meta.title)} description=${Boolean(meta.description)} canonical=${Boolean(meta.canonical)} h1=${meta.h1Count} localhost=${meta.hasLocalhost}`)}

## Problèmes responsive
${bulletList(responsiveIssues, (item) => item.issue === "whatsapp-overlap"
  ? `${item.route} (${item.viewport}/${item.theme}) WhatsApp chevauche "${textPreview(item.ctaText)}"`
  : `${item.route} (${item.viewport}/${item.theme}) largeur document ${item.documentWidth}px > viewport ${item.viewportWidth}px`)}

## Problèmes d'accessibilité
${bulletList(accessibilityIssues, (item) => `${item.route} (${item.viewport}/${item.theme}) ${item.issue}: ${textPreview(item.text || item.href || item.tag || "")}`)}

## Problèmes de mode sombre
${bulletList(darkModeIssues, (item) => `${item.route} (${item.viewport}/${item.theme}) ${item.check}: ${item.error || item.reason || "échec"}`)}

## Éléments non testables
${bulletList(reports.notTestable, (item) => `${item.route} - ${item.check}: ${item.reason}`)}

## Totaux
- Routes uniques: ${routesTested.length}
- Audits page: ${reports.pages.length}
- Liens collectés: ${reports.links.length}
- Boutons collectés: ${reports.buttons.length}
- Images collectées: ${reports.images.length}
- Images sans alt visible: ${reports.images.filter((image) => image.visible && (image.alt == null || image.alt.trim() === "")).length}
- Erreurs console: ${reports.consoleErrors.length}
- Erreurs réseau: ${reports.failedRequests.length}
- Problèmes responsive: ${responsiveIssues.length}
- Problèmes accessibilité: ${accessibilityIssues.length}
`;

  await writeFile(path.join(OUT_DIR, "audit-summary.md"), summary, "utf8");
}

async function main() {
  await ensureOutput();

  const browser = await chromium.launch({ headless: true });
  const dynamicRoutes = await discoverDynamicRoutes(browser);
  const routes = [...new Set([...BASE_ROUTES, ...dynamicRoutes])];

  for (const route of routes) {
    for (const viewport of VIEWPORTS) {
      for (const theme of ["light", "dark"]) {
        console.log(`[audit] ${route} ${viewport.name} ${theme}`);
        await auditRoute(browser, route, viewport, theme);
      }
    }
  }

  const collectedDynamicRoutes = discoverDynamicRoutesFromCollectedLinks(routes);
  for (const route of collectedDynamicRoutes) {
    routes.push(route);
    for (const viewport of VIEWPORTS) {
      for (const theme of ["light", "dark"]) {
        console.log(`[audit] ${route} ${viewport.name} ${theme}`);
        await auditRoute(browser, route, viewport, theme);
      }
    }
  }

  addMissingDynamicNotTestable(routes);

  const linkChecks = await verifyLinks(browser);
  reports.links = reports.links.map((link) => {
    const resolved = sameSiteHttpLink(link.resolvedHref || link.href);
    const checked = resolved ? linkChecks.find((item) => item.resolvedHref === resolved || item.url === resolved) : null;
    return {
      ...link,
      invalid: isInvalidHref(link.href),
      status: checked?.status ?? null,
      finalUrl: checked?.finalUrl ?? null,
      error: checked?.error ?? null,
    };
  });

  await browser.close();

  await writeJson("pages.json", reports.pages);
  await writeJson("links.json", reports.links);
  await writeJson("buttons.json", reports.buttons);
  await writeJson("images.json", reports.images);
  await writeJson("console-errors.json", reports.consoleErrors);
  await writeJson("failed-requests.json", reports.failedRequests);
  await writeJson("metadata.json", reports.metadata);
  await writeJson("responsive.json", reports.responsive);
  await writeJson("accessibility.json", reports.accessibility);
  await writeJson("forms.json", reports.forms);
  await writeJson("interactions.json", reports.interactions);
  await writeJson("link-checks.json", linkChecks);
  await writeSummary(routes, linkChecks);

  const totals = countIssues();
  console.log(`[audit] done: ${reports.pages.length} page audits, ${totals.pageErrors.length} page errors, ${reports.consoleErrors.length} console warnings/errors, ${reports.failedRequests.length} failed requests.`);
  console.log(`[audit] output: ${OUT_DIR}`);
}

main().catch(async (error) => {
  console.error("[audit] fatal", error);
  reports.notTestable.push({ route: "*", check: "fatal", reason: error.message });
  await mkdir(path.join(OUT_DIR, "reports"), { recursive: true }).catch(() => {});
  await writeJson("pages.json", reports.pages).catch(() => {});
  await writeJson("console-errors.json", reports.consoleErrors).catch(() => {});
  await writeJson("failed-requests.json", reports.failedRequests).catch(() => {});
  await writeFile(path.join(OUT_DIR, "audit-summary.md"), `# Yakout Full Site Audit\n\nFatal error: ${error.message}\n`, "utf8").catch(() => {});
  process.exitCode = 1;
});
