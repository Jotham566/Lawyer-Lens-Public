import { chromium, devices } from "@playwright/test";

const ACTS_URL = "http://localhost:3001/legislation/acts";
const JUDGMENTS_URL = "http://localhost:3001/judgments";
const COURT_JUDGMENTS_URL = "http://localhost:3001/judgments/high_court";
const BROWSE_JUDGMENTS_URL = "http://localhost:3001/browse/judgments";

async function captureDesktop(page, url, outputPath, waitForSelector) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 15000 });
  }
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1400 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();

  await captureDesktop(
    desktopPage,
    ACTS_URL,
    "/tmp/acts-page-desktop.png",
    "h1:text('Acts of Parliament')"
  );
  const firstActLink = desktopPage.locator("a[href^='/document/']").first();
  await firstActLink.waitFor({ timeout: 15000 });
  const href = await firstActLink.getAttribute("href");
  if (!href) {
    throw new Error("Could not find a document link on the Acts page.");
  }

  await captureDesktop(
    desktopPage,
    `http://localhost:3001${href}`,
    "/tmp/act-detail-page-desktop.png",
    "h1"
  );
  await captureDesktop(
    desktopPage,
    JUDGMENTS_URL,
    "/tmp/judgments-page-desktop.png",
    "h1:text('Court Judgments')"
  );
  await captureDesktop(
    desktopPage,
    COURT_JUDGMENTS_URL,
    "/tmp/judgments-court-page-desktop.png",
    "h1:text('High Court')"
  );
  await captureDesktop(
    desktopPage,
    BROWSE_JUDGMENTS_URL,
    "/tmp/judgments-browse-page-desktop.png",
    "h1:text('Judgments')"
  );
  const firstJudgmentLink = desktopPage.locator("a[href^='/document/']").first();
  await firstJudgmentLink.waitFor({ timeout: 15000 });
  const judgmentHref = await firstJudgmentLink.getAttribute("href");
  if (!judgmentHref) {
    throw new Error("Could not find a document link on the judgments page.");
  }
  await captureDesktop(
    desktopPage,
    `http://localhost:3001${judgmentHref}`,
    "/tmp/judgment-detail-page-desktop.png",
    "h1"
  );

  const mobileContext = await browser.newContext({
    ...devices["Pixel 7"],
  });
  const mobilePage = await mobileContext.newPage();
  await captureDesktop(
    mobilePage,
    ACTS_URL,
    "/tmp/acts-page-mobile-chromium.png",
    "h1:text('Acts of Parliament')"
  );
  await captureDesktop(
    mobilePage,
    `http://localhost:3001${href}`,
    "/tmp/act-detail-page-mobile-chromium.png",
    "h1"
  );
  await captureDesktop(
    mobilePage,
    JUDGMENTS_URL,
    "/tmp/judgments-page-mobile-chromium.png",
    "h1:text('Court Judgments')"
  );
  await captureDesktop(
    mobilePage,
    COURT_JUDGMENTS_URL,
    "/tmp/judgments-court-page-mobile-chromium.png",
    "h1:text('High Court')"
  );
  await captureDesktop(
    mobilePage,
    BROWSE_JUDGMENTS_URL,
    "/tmp/judgments-browse-page-mobile-chromium.png",
    "h1:text('Judgments')"
  );
  await captureDesktop(
    mobilePage,
    `http://localhost:3001${judgmentHref}`,
    "/tmp/judgment-detail-page-mobile-chromium.png",
    "h1"
  );

  await desktopContext.close();
  await mobileContext.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
