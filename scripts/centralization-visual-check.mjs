import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:8003/api/v1";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "/tmp/lawlens-centralization-check";
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

for (const theme of ["light", "dark"]) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    colorScheme: theme,
  });
  const page = await context.newPage();

  await login(page);

  for (const [path, name] of [
    ["/", "home"],
    ["/judgments", "judgments"],
    ["/search?q=contract", "search"],
    ["/chat", "chat"],
    ["/research", "research"],
    ["/contracts", "contracts"],
  ]) {
    await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    await page.screenshot({
      path: `${OUTPUT_DIR}/${name}-${theme}.png`,
      fullPage: true,
    });
  }

  await context.close();
  await browser.close();
}

console.log(OUTPUT_DIR);
