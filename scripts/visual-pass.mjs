import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:8003/api/v1";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/lawlens-visual-pass";
const creds = {
  email: process.env.DEMO_EMAIL || "john.owner@acmelaw.com",
  password: process.env.DEMO_PASSWORD || "demo123",
};

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

async function capture(page, filename, waitSelector) {
  await page.waitForLoadState("domcontentloaded");
  if (waitSelector) {
    await page.locator(waitSelector).first().waitFor({
      state: "visible",
      timeout: 20000,
    }).catch(() => {});
  }
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: `${OUTPUT_DIR}/${filename}`,
    fullPage: true,
  });
}

async function gotoRoute(page, path) {
  const url = `${BASE_URL}${path}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, {
        waitUntil: attempt === 0 ? "domcontentloaded" : "networkidle",
      });
      return;
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
      await page.waitForTimeout(1200);
    }
  }
}

async function waitForText(page, matcher, timeout = 15000) {
  await page
    .waitForFunction(
      (pattern) => {
        const bodyText = document.body?.innerText || "";
        return new RegExp(pattern, "i").test(bodyText);
      },
      matcher,
      { timeout }
    )
    .catch(() => {});
}

async function populateChat(page) {
  await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded" });
  const composer = page.locator("textarea").first();
  await composer.waitFor({ state: "visible", timeout: 20000 });

  const trustBadge = page.getByText(/Verified|Mostly Verified|High Confidence|Good Confidence|Moderate Confidence/).first();
  const confidenceToggle = page.getByRole("button", { name: /Why this confidence\?|Why this answer/i }).first();
  if (await trustBadge.isVisible().catch(() => false)) {
    return trustBadge;
  }
  if (await confidenceToggle.isVisible().catch(() => false)) {
    return confidenceToggle;
  }

  const existingConversation = page
    .locator("[role='button']")
    .filter({ hasText: /What|Research|NDA|Employment|Tax|Agreement|Contract/i })
    .first();

  if (await existingConversation.isVisible().catch(() => false)) {
    await existingConversation.click().catch(() => {});
    await Promise.race([
      trustBadge.waitFor({ state: "visible", timeout: 12000 }).catch(() => {}),
      confidenceToggle.waitFor({ state: "visible", timeout: 12000 }).catch(() => {}),
      page.waitForTimeout(8000),
    ]);
    if (await trustBadge.isVisible().catch(() => false)) {
      return trustBadge;
    }
    if (await confidenceToggle.isVisible().catch(() => false)) {
      return confidenceToggle;
    }
  }

  await composer.fill("What are the requirements for a valid contract under Ugandan law?");
  await composer.press("Enter");
  await Promise.race([
    trustBadge.waitFor({ state: "visible", timeout: 25000 }).catch(() => {}),
    confidenceToggle.waitFor({ state: "visible", timeout: 25000 }).catch(() => {}),
    page.locator("[data-message-role='assistant'], [data-role='assistant']").first().waitFor({
      state: "visible",
      timeout: 25000,
    }).catch(() => {}),
    page.waitForTimeout(9000),
  ]);
  return (await trustBadge.isVisible().catch(() => false)) ? trustBadge : confidenceToggle;
}

async function captureTheme(theme) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  const page = await context.newPage();

  await login(page);

  await gotoRoute(page, `/`);
  await capture(page, `home-${theme}.png`, "main");

  await gotoRoute(page, `/pricing`);
  await capture(page, `pricing-${theme}.png`, "main");

  await gotoRoute(page, `/dashboard`);
  await capture(page, `dashboard-${theme}.png`, "main");

  await gotoRoute(page, `/search?q=contract`);
  await capture(page, `search-${theme}.png`, "#search-input");

  const trustBadge = await populateChat(page);
  if (await trustBadge.isVisible().catch(() => false)) {
    await trustBadge.hover().catch(() => {});
    await page.waitForTimeout(600);
  }
  await capture(page, `chat-${theme}.png`, "main");

  await gotoRoute(page, `/knowledge-base`);
  await waitForText(page, "Knowledge Base|Upgrade to Enterprise", 18000);
  await capture(page, `knowledge-base-${theme}.png`, "main");

  await gotoRoute(page, `/settings`);
  await waitForText(page, "Profile Settings|Settings", 18000);
  await capture(page, `settings-${theme}.png`, "main");

  await gotoRoute(page, `/billing`);
  await waitForText(page, "Billing & Usage|Current Plan", 18000);
  await capture(page, `billing-${theme}.png`, "main");

  await gotoRoute(page, `/admin`);
  await waitForText(page, "Admin Console|Quick Actions", 18000);
  await capture(page, `admin-${theme}.png`, "main");

  await gotoRoute(page, `/about`);
  await waitForText(page, "About Law Lens Uganda|Our Mission", 18000);
  await capture(page, `about-${theme}.png`, "main");

  await gotoRoute(page, `/help`);
  await waitForText(page, "Help & FAQ|Frequently Asked Questions", 18000);
  await capture(page, `help-${theme}.png`, "main");

  await context.close();
  await browser.close();
}

mkdirSync(OUTPUT_DIR, { recursive: true });
await captureTheme("light");
await captureTheme("dark");
