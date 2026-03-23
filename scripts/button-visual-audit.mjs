import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:8003/api/v1";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/lawlens-button-audit";
const creds = {
  email: process.env.DEMO_EMAIL || "john.owner@acmelaw.com",
  password: process.env.DEMO_PASSWORD || "demo123",
};

const BUTTON_SELECTOR = [
  "[data-slot='button']",
  "button",
  "[role='button']",
  "a.ll-cta-brand",
  "a.ll-button-primary",
  "a.ll-button-outline",
  "a.ll-button-secondary",
  "a.ll-button-ghost",
].join(",");

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/help",
  "/pricing",
  "/privacy",
  "/terms",
  "/waitlist/status",
  "/browse",
  "/browse/acts",
  "/browse/constitution",
  "/browse/judgments",
  "/browse/regulations",
  "/judgments",
  "/judgments/supreme",
  "/legislation",
  "/legislation/acts",
  "/legislation/constitution",
  "/legislation/regulations",
  "/search?q=contract",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/account/delete/cancel",
  "/account/delete/confirm",
  "/checkout",
];

const authRoutes = [
  "/chat",
  "/dashboard",
  "/library",
  "/knowledge-base",
  "/research",
  "/research/history",
  "/contracts",
  "/settings",
  "/settings/activity",
  "/settings/billing",
  "/settings/billing/invoices",
  "/settings/billing/payment-methods",
  "/settings/billing/subscription",
  "/settings/billing/usage",
  "/settings/preferences",
  "/settings/security",
  "/settings/organization",
  "/settings/organization/invitations",
  "/settings/organization/members",
  "/settings/organization/new",
  "/billing",
  "/billing/checkout",
  "/billing/failed",
  "/billing/invoices",
  "/billing/payment-methods",
  "/billing/pending",
  "/billing/plans",
  "/billing/success",
  "/admin",
  "/admin/audit-logs",
  "/admin/billing",
  "/admin/integrations",
  "/admin/security",
  "/admin/team",
  "/onboarding",
];

mkdirSync(OUTPUT_DIR, { recursive: true });
mkdirSync(path.join(OUTPUT_DIR, "flags"), { recursive: true });

async function gotoRoute(page, route) {
  const url = `${BASE_URL}${route}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, {
        waitUntil: attempt === 0 ? "domcontentloaded" : "networkidle",
      });
      await page.waitForTimeout(350);
      return;
    } catch (error) {
      if (attempt === 1) throw error;
      await page.waitForTimeout(1200);
    }
  }
}

async function login(page) {
  await gotoRoute(page, "/");
  const status = await page.evaluate(
    async ({ apiUrl, credentials }) => {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      return response.status;
    },
    { apiUrl: API_URL, credentials: creds }
  );

  if (status !== 200) {
    throw new Error(`Login failed with status ${status}`);
  }
}

function routeToSlug(route) {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/[/?=&]+/g, "-").replace(/-+/g, "-");
}

function summarizeLabel(text, ariaLabel, title) {
  return (text || ariaLabel || title || "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function hasMeaningfulDelta(before, after) {
  return (
    before.backgroundColor !== after.backgroundColor ||
    before.color !== after.color ||
    before.borderColor !== after.borderColor ||
    before.boxShadow !== after.boxShadow ||
    before.transform !== after.transform ||
    before.svgColor !== after.svgColor
  );
}

function hasSharedButtonClass(className) {
  return [
    "ll-button-",
    "ll-cta-brand",
    "ll-icon-button",
    "ll-chip-button",
    "ll-text-link",
    "ll-row-interactive",
    "ll-page-panel-interactive",
  ].some((token) => className.includes(token));
}

async function annotateVisibleButtons(page) {
  return page.evaluate((selector) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    const uniqueNodes = Array.from(new Set(nodes));

    function isVisible(node) {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity || "1") > 0.03 &&
        rect.width >= 18 &&
        rect.height >= 18 &&
        rect.bottom > 0 &&
        rect.right > 0
      );
    }

    return uniqueNodes
      .filter((node) => isVisible(node))
      .map((node, index) => {
        node.setAttribute("data-button-audit-id", String(index + 1));
        return {
          id: String(index + 1),
          tag: node.tagName.toLowerCase(),
          text: (node.textContent || "").trim(),
          ariaLabel: node.getAttribute("aria-label") || "",
          title: node.getAttribute("title") || "",
          className: node.className || "",
          href: node.getAttribute("href") || "",
          type: node.getAttribute("type") || "",
        };
      });
  }, BUTTON_SELECTOR);
}

async function readStyles(page, auditId) {
  return page.evaluate((id) => {
    const node = document.querySelector(`[data-button-audit-id="${id}"]`);
    if (!node) return null;
    const style = window.getComputedStyle(node);
    const svg = node.querySelector("svg");
    const svgStyle = svg ? window.getComputedStyle(svg) : null;
    const rect = node.getBoundingClientRect();
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      transform: style.transform,
      svgColor: svgStyle?.color || "",
      width: rect.width,
      height: rect.height,
    };
  }, auditId);
}

async function auditRoute(page, route, theme, bucket) {
  const routeSlug = routeToSlug(route);
  await gotoRoute(page, route);

  const buttons = await annotateVisibleButtons(page);
  const entries = [];
  const flags = [];

  for (const button of buttons) {
    const locator = page.locator(`[data-button-audit-id="${button.id}"]`);

    try {
      await locator.scrollIntoViewIfNeeded();
      const before = await readStyles(page, button.id);
      if (!before) continue;

      await locator.hover({ force: true });
      await page.waitForTimeout(120);
      const after = await readStyles(page, button.id);
      if (!after) continue;

      const label = summarizeLabel(button.text, button.ariaLabel, button.title);
      const shared = hasSharedButtonClass(button.className);
      const delta = hasMeaningfulDelta(before, after);

      const flaggedReasons = [];
      if (!delta) flaggedReasons.push("no_hover_delta");
      if (!shared && button.tag !== "button" && !button.className.includes("data-slot")) {
        flaggedReasons.push("bypasses_shared_button_system");
      }
      if (
        button.className.includes("hover:bg-muted") ||
        button.className.includes("hover:bg-accent") ||
        button.className.includes("hover:text-foreground")
      ) {
        flaggedReasons.push("raw_local_hover_class");
      }

      const entry = {
        route,
        routeSlug,
        theme,
        bucket,
        ...button,
        label,
        before,
        after,
        shared,
        delta,
        flaggedReasons,
      };

      entries.push(entry);

      if (flaggedReasons.length > 0) {
        const clip = await locator.boundingBox();
        if (clip && clip.width > 8 && clip.height > 8) {
          const shot = path.join(
            OUTPUT_DIR,
            "flags",
            `${routeSlug}-${theme}-button-${button.id}.png`
          );
          await page.screenshot({ path: shot, clip });
        }
        flags.push(entry);
      }
    } catch (error) {
      flags.push({
        route,
        routeSlug,
        theme,
        bucket,
        ...button,
        label: summarizeLabel(button.text, button.ariaLabel, button.title),
        flaggedReasons: ["audit_error"],
        error: String(error),
      });
    }
  }

  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${routeSlug}-${theme}.png`),
    fullPage: true,
  });

  return { entries, flags };
}

async function discoverDynamicRoutes(page) {
  const discovered = [];

  await gotoRoute(page, "/search?q=contract");
  const documentHref = await page
    .locator("a[href*='/document/']")
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (documentHref) discovered.push(documentHref);

  await gotoRoute(page, "/library");
  const libraryHref = await page
    .locator("a[href*='/library/']")
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (libraryHref) discovered.push(libraryHref);

  return discovered;
}

async function runThemeAudit(theme) {
  const browser = await chromium.launch({ headless: true });

  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  const publicPage = await publicContext.newPage();

  const authContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  const authPage = await authContext.newPage();
  await login(authPage);

  const dynamicRoutes = await discoverDynamicRoutes(authPage);

  const report = {
    theme,
    publicRoutes,
    authRoutes,
    dynamicRoutes,
    skippedRoutes: ["/auth/callback/[provider]", "/invite/[token]"],
    entries: [],
    flags: [],
  };

  for (const route of publicRoutes) {
    const result = await auditRoute(publicPage, route, theme, "public");
    report.entries.push(...result.entries);
    report.flags.push(...result.flags);
  }

  for (const route of [...authRoutes, ...dynamicRoutes]) {
    const result = await auditRoute(authPage, route, theme, "auth");
    report.entries.push(...result.entries);
    report.flags.push(...result.flags);
  }

  writeFileSync(
    path.join(OUTPUT_DIR, `button-audit-${theme}.json`),
    JSON.stringify(report, null, 2)
  );

  await publicContext.close();
  await authContext.close();
  await browser.close();

  return report;
}

const light = await runThemeAudit("light");
const dark = await runThemeAudit("dark");

const summary = {
  generatedAt: new Date().toISOString(),
  outputDir: OUTPUT_DIR,
  totals: {
    lightEntries: light.entries.length,
    lightFlags: light.flags.length,
    darkEntries: dark.entries.length,
    darkFlags: dark.flags.length,
  },
  skippedRoutes: light.skippedRoutes,
};

writeFileSync(
  path.join(OUTPUT_DIR, "button-audit-summary.json"),
  JSON.stringify(summary, null, 2)
);

console.log(JSON.stringify(summary, null, 2));
