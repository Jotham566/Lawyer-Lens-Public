import { chromium } from "@playwright/test";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  await page.goto("http://localhost:3001/login?returnUrl=%2Fresearch", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.fill("#login-email", "solo.lawyer@lawoffice.com");
  await page.fill("#login-password", "demo123");
  await page.click('button[type="submit"]');
  await page.waitForLoadState("networkidle");

  await page.goto("http://localhost:3001/research", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/research-visual-pass-light.png", fullPage: true });

  const light = {
    url: page.url(),
    detailsCount: await page.locator('details[data-inline-citations="true"]').count(),
    summaryCount: await page.locator('details[data-inline-citations="true"] > summary').count(),
    endnotesCount: await page.locator('[data-report-part="endnotes"] details').count(),
    visibleChipCount: await page.locator('summary:has-text("[")').count(),
  };

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload({ waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/research-visual-pass-dark.png", fullPage: true });

  const dark = {
    url: page.url(),
    detailsCount: await page.locator('details[data-inline-citations="true"]').count(),
    summaryCount: await page.locator('details[data-inline-citations="true"] > summary').count(),
    endnotesCount: await page.locator('[data-report-part="endnotes"] details').count(),
    visibleChipCount: await page.locator('summary:has-text("[")').count(),
  };

  console.log(JSON.stringify({ light, dark }, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
