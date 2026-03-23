import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:8003/api/v1";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/lawlens-visual-pass";
const creds = {
  email: process.env.DEMO_EMAIL || "john.owner@acmelaw.com",
  password: process.env.DEMO_PASSWORD || "demo123",
};

mkdirSync(OUTPUT_DIR, { recursive: true });

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
}

async function captureCitationHover() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: "light",
  });
  const page = await context.newPage();

  await login(page);
  await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded" });
  await page.locator("textarea").first().waitFor({ state: "visible", timeout: 20000 });

  await openConversationWithCitation(page);

  const citation = page.locator("[aria-label^='Citation']").first();
  await citation.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  if (await citation.isVisible().catch(() => false)) {
    await citation.hover().catch(() => {});
    await page.waitForTimeout(500);
  } else {
    await page.waitForTimeout(1000);
  }
  await page.screenshot({
    path: `${OUTPUT_DIR}/citation-hover-light.png`,
    fullPage: true,
  });

  const trustBadge = page.getByRole("button", { name: /Verified|Mostly Verified|Review Suggested/i }).first();
  await trustBadge.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  if (await trustBadge.isVisible().catch(() => false)) {
    await trustBadge.hover().catch(() => {});
    await page.waitForTimeout(500);
  }
  await page.screenshot({
    path: `${OUTPUT_DIR}/trust-indicators-light.png`,
    fullPage: true,
  });

  await context.close();
  await browser.close();
}

async function selectTool(page, toolLabel) {
  const trigger = page.getByRole("button", { name: /Tools|Active:/i }).first();
  await trigger.click();
  await page.getByText(toolLabel, { exact: true }).click();
}

async function submitPrompt(page, prompt) {
  const input = page.locator("#chat-input");
  await input.waitFor({ state: "visible", timeout: 20000 });
  await input.fill(prompt);
  await input.press("Enter");
}

async function openConversationMatching(page, titlePattern, contentPattern) {
  const conversations = page.locator("[role='button']");
  const count = await conversations.count();

  for (let index = 0; index < count; index += 1) {
    const item = conversations.nth(index);
    const text = (await item.textContent().catch(() => "")) || "";
    if (!titlePattern.test(text) || /New Chat/i.test(text)) {
      continue;
    }

    await item.click().catch(() => {});
    await Promise.race([
      page.waitForFunction(
        (pattern) => new RegExp(pattern, "i").test(document.body?.innerText || ""),
        contentPattern.source,
        { timeout: 8000 }
      ).catch(() => {}),
      page.waitForTimeout(1200),
    ]);

    const hasExpectedContent = await page
      .evaluate((pattern) => new RegExp(pattern, "i").test(document.body?.innerText || ""), contentPattern.source)
      .catch(() => false);

    if (hasExpectedContent) {
      return true;
    }
  }

  return false;
}

async function openConversationWithCitation(page) {
  const conversations = page.locator("[role='button']");
  const count = await conversations.count();

  for (let index = 0; index < count; index += 1) {
    const item = conversations.nth(index);
    const text = (await item.textContent().catch(() => "")) || "";
    if (/New Chat/i.test(text)) {
      continue;
    }

    await item.click().catch(() => {});
    await Promise.race([
      page.waitForFunction(
        () => Boolean(document.querySelector("[aria-label^='Citation']")),
        { timeout: 5000 }
      ).catch(() => {}),
      page.waitForTimeout(1200),
    ]);

    const hasCitation = await page
      .evaluate(() => Boolean(document.querySelector("[aria-label^='Citation']")))
      .catch(() => false);

    if (hasCitation) {
      return true;
    }
  }

  return false;
}

async function waitForToolOutput(page, toolLabel) {
  await Promise.race([
    page.getByText(toolLabel, { exact: true }).waitFor({ state: "visible", timeout: 25000 }).catch(() => {}),
    page.getByText(/Executive Summary|Download Contract|Sources|Contract Draft|Deep Research/).first().waitFor({
      state: "visible",
      timeout: 25000,
    }).catch(() => {}),
    page.waitForTimeout(12000),
  ]);
}

async function captureToolFlows() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  await login(page);
  await page.goto(`${BASE_URL}/chat`, { waitUntil: "domcontentloaded" });
  await page.locator("textarea").first().waitFor({ state: "visible", timeout: 20000 });

  const foundResearchConversation = await openConversationMatching(
    page,
    /Research|Compare|Tax|Employment/i,
    /Executive Summary|Sources|Deep Research/i
  );

  if (!foundResearchConversation) {
    await selectTool(page, "Deep Research");
    await submitPrompt(page, "Compare employment termination procedures under Uganda law.");
    await page.waitForTimeout(1800);
  }

  await page.screenshot({
    path: `${OUTPUT_DIR}/deep-research-running-dark.png`,
    fullPage: true,
  });

  if (!foundResearchConversation) {
    await waitForToolOutput(page, "Deep Research");
    await page.waitForTimeout(2000);
  }

  await page.screenshot({
    path: `${OUTPUT_DIR}/deep-research-result-dark.png`,
    fullPage: true,
  });

  const newChat = page.getByRole("button", { name: /New Chat/i }).first();
  if (await newChat.isVisible().catch(() => false)) {
    await newChat.click().catch(() => {});
    await page.waitForTimeout(800);
  }

  const foundContractConversation = await openConversationMatching(
    page,
    /Employment|Contract|Agreement|NDA|Lease|Service/i,
    /Download Contract|Contract Draft|Recitals|Terms and Conditions/i
  );

  if (!foundContractConversation) {
    await selectTool(page, "Draft Contract");
    await submitPrompt(page, "Employment contract for a software developer in Uganda.");
    await page.waitForTimeout(1800);
  }

  await page.screenshot({
    path: `${OUTPUT_DIR}/draft-contract-running-dark.png`,
    fullPage: true,
  });

  if (!foundContractConversation) {
    await waitForToolOutput(page, "Contract Draft");
    await page.waitForTimeout(2000);
  }

  await page.screenshot({
    path: `${OUTPUT_DIR}/draft-contract-result-dark.png`,
    fullPage: true,
  });

  await context.close();
  await browser.close();
}

await captureCitationHover();
await captureToolFlows();
