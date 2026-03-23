import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:8003/api/v1";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/lawlens-header-hover-check";
const creds = {
  email: process.env.DEMO_EMAIL || "john.owner@acmelaw.com",
  password: process.env.DEMO_PASSWORD || "demo123",
};

mkdirSync(OUTPUT_DIR, { recursive: true });

async function settle(page, timeout = 450) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(timeout);
}

async function safeHover(locator) {
  await locator.hover({ force: true }).catch(() => {});
}

async function login(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
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

  await page.waitForTimeout(1200);
}

async function capturePublicHeader(page, theme) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await settle(page);

  const legislationTrigger = page.getByRole("button", { name: /Legislation/i }).first();
  await safeHover(legislationTrigger);
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${OUTPUT_DIR}/public-header-${theme}.png`,
    fullPage: false,
  });

  await legislationTrigger.click().catch(() => {});
  await page.waitForTimeout(250);
  const legislationLink = page.getByRole("link", { name: /Acts of Parliament/i }).first();
  await safeHover(legislationLink);
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${OUTPUT_DIR}/public-menu-${theme}.png`,
    fullPage: false,
  });
}

async function captureAuthenticatedHeader(page, theme) {
  await login(page);
  await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded" });
  await settle(page);

  const askLink = page.getByRole("link", { name: /Ask in Plain English/i }).first();
  await safeHover(askLink);
  await page.waitForTimeout(250);

  const userMenu = page.getByRole("button").filter({ hasText: /John|JO/i }).first();
  await safeHover(userMenu);
  await userMenu.click().catch(() => {});
  await page.waitForTimeout(250);

  const billingItem = page.getByRole("link", { name: /Billing/i }).first();
  await safeHover(billingItem);
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${OUTPUT_DIR}/auth-header-${theme}.png`,
    fullPage: false,
  });
}

for (const theme of ["light", "dark"]) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 980 },
    colorScheme: theme,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await capturePublicHeader(page, theme);
  await captureAuthenticatedHeader(page, theme);

  await context.close();
  await browser.close();
}

console.log(OUTPUT_DIR);
process.exit(0);
