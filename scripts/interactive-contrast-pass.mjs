import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:8003/api/v1";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/lawlens-contrast-pass";
const creds = {
  email: process.env.DEMO_EMAIL || "john.owner@acmelaw.com",
  password: process.env.DEMO_PASSWORD || "demo123",
};

mkdirSync(OUTPUT_DIR, { recursive: true });

async function gotoRoute(page, path) {
  const url = `${BASE_URL}${path}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, {
        waitUntil: attempt === 0 ? "domcontentloaded" : "networkidle",
      });
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

async function selectNodeContents(page, selector) {
  await page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, selector);
}

async function openConversationWithCitation(page) {
  const conversations = page.locator("[role='button']");
  const count = await conversations.count();

  for (let index = 0; index < count; index += 1) {
    const item = conversations.nth(index);
    const text = (await item.textContent().catch(() => "")) || "";
    if (/New Chat/i.test(text)) continue;

    await item.click().catch(() => {});
    await Promise.race([
      page.waitForFunction(
        () => Boolean(document.querySelector("[aria-label^='Citation']")),
        { timeout: 6000 }
      ).catch(() => {}),
      page.waitForTimeout(1200),
    ]);

    const hasCitation = await page
      .evaluate(() => Boolean(document.querySelector("[aria-label^='Citation']")))
      .catch(() => false);

    if (hasCitation) return true;
  }

  return false;
}

async function captureAnonTheme(theme) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  const page = await context.newPage();

  await gotoRoute(page, "/");
  await page.getByRole("button", { name: /Search/i }).first().waitFor({ state: "visible", timeout: 12000 }).catch(() => {});
  const suggestion = page.locator("button").filter({ hasText: /Tax Law|Corporate/i }).first();
  if (await suggestion.isVisible().catch(() => false)) {
    await suggestion.hover().catch(() => {});
  }
  await selectNodeContents(page, "h1");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/home-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/help");
  const quickLink = page.locator("a").filter({ hasText: /Search Documents|Legal Assistant/i }).first();
  if (await quickLink.isVisible().catch(() => false)) {
    await quickLink.hover().catch(() => {});
  }
  const accordion = page.getByRole("button", { name: /How do I search for legal documents/i }).first();
  if (await accordion.isVisible().catch(() => false)) {
    await accordion.click().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/help-interactive-${theme}.png`, fullPage: true });

  await context.close();
  await browser.close();
}

async function captureAuthTheme(theme) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  const page = await context.newPage();

  await login(page);

  await gotoRoute(page, "/search?q=contract");
  await page.locator("main, body").first().waitFor({ state: "visible", timeout: 12000 }).catch(() => {});
  const resultCard = page.locator("a[href*='/document/']").first();
  if (await resultCard.isVisible().catch(() => false)) {
    await resultCard.hover().catch(() => {});
  }
  await selectNodeContents(page, "main p");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUTPUT_DIR}/search-interactive-${theme}.png`, fullPage: true });

  if (await resultCard.isVisible().catch(() => false)) {
    await resultCard.click().catch(() => {});
    await page.waitForTimeout(700);
    const relatedDoc = page.locator("aside a[href*='/document/']").first();
    if (await relatedDoc.isVisible().catch(() => false)) {
      await relatedDoc.hover().catch(() => {});
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUTPUT_DIR}/document-interactive-${theme}.png`, fullPage: true });
  }

  await gotoRoute(page, "/judgments");
  const courtCard = page.locator("a[href*='/judgments/']").first();
  if (await courtCard.isVisible().catch(() => false)) {
    await courtCard.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/judgments-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/legislation");
  const legislationCard = page.locator("a[href='/legislation/acts']").first();
  if (await legislationCard.isVisible().catch(() => false)) {
    await legislationCard.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/legislation-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/legislation/acts");
  const actCard = page.locator("a[href*='/document/']").first();
  if (await actCard.isVisible().catch(() => false)) {
    await actCard.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/acts-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/legislation/regulations");
  const regulationCard = page.locator("a[href*='/document/']").first();
  if (await regulationCard.isVisible().catch(() => false)) {
    await regulationCard.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/regulations-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/legislation/constitution");
  const chapterCard = page.locator("main .grid .rounded-2xl, main .grid .rounded-xl, main .grid .border").first();
  if (await chapterCard.isVisible().catch(() => false)) {
    await chapterCard.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/constitution-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/dashboard");
  const dashboardTile = page.locator("a[href='/legislation/acts'], a[href='/judgments'], a[href='/search']").first();
  if (await dashboardTile.isVisible().catch(() => false)) {
    await dashboardTile.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/dashboard-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/library");
  const libraryCard = page.locator("a[href*='/library/']").first();
  if (await libraryCard.isVisible().catch(() => false)) {
    await libraryCard.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/library-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/chat");
  await page.locator("textarea, #chat-input").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  await openConversationWithCitation(page);
  const citation = page.locator("[aria-label^='Citation']").first();
  if (await citation.isVisible().catch(() => false)) {
    await citation.hover().catch(() => {});
  }
  const trustBadge = page.getByRole("button", { name: /Verified|Mostly Verified|Review Suggested/i }).first();
  if (await trustBadge.isVisible().catch(() => false)) {
    await trustBadge.hover().catch(() => {});
  }
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUTPUT_DIR}/chat-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/billing");
  const billingButton = page.getByRole("link", { name: /View Plans/i }).first();
  if (await billingButton.isVisible().catch(() => false)) {
    await billingButton.hover().catch(() => {});
  }
  await selectNodeContents(page, "main h1, h1");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/billing-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/admin");
  const quickAction = page.locator("a").filter({ hasText: /Invite Team Members|Manage Team/i }).first();
  if (await quickAction.isVisible().catch(() => false)) {
    await quickAction.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/admin-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/research");
  await page.locator("main").first().waitFor({ state: "visible", timeout: 12000 }).catch(() => {});
  await selectNodeContents(page, "[contenteditable='true'] p, [contenteditable='false'] p, main p");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/research-interactive-${theme}.png`, fullPage: true });

  await gotoRoute(page, "/contracts");
  const contractNav = page.locator("button").filter({ hasText: /Start fresh|Use template|Clone past contract/i }).first();
  if (await contractNav.isVisible().catch(() => false)) {
    await contractNav.hover().catch(() => {});
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUTPUT_DIR}/contracts-interactive-${theme}.png`, fullPage: true });

  await context.close();
  await browser.close();
}

await captureAnonTheme("light");
await captureAnonTheme("dark");
await captureAuthTheme("light");
await captureAuthTheme("dark");
