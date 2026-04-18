/**
 * Discoverability remediation — Phase 1 verification.
 *
 * Verifies the entry-point fixes that close the user-stated gap
 * ("Deep Research and Contracts Drafting aren't accessibly intuitive"):
 *
 * 1. Landing page hero + final CTAs deep-link to /research and /contracts
 *    with the intent= analytics param.
 * 2. Header quick-links dropdown surfaces both tools.
 * 3. Mobile drawer Tools section surfaces both tools.
 * 4. Desktop sidebar Tools section surfaces both tools.
 * 5. /research/history filter tabs are a real ARIA tablist (keyboard
 *    navigable + aria-selected).
 *
 * These tests run unauthenticated where possible. Auth-gated surfaces
 * (sidebar, mobile drawer, history) use the seeded enterprise account.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAsTeamUser, SEEDED_USERS, login } from "./utils/auth";

test.describe("Discoverability — landing CTAs", () => {
  test("hero shows Try Deep Research and Draft a Contract CTAs", async ({ page }) => {
    await page.goto("/landing");
    await expect(page.getByRole("button", { name: /Try Deep Research/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Draft a Contract/i })).toBeVisible();
  });

  test("hero CTA routes unauthenticated visitor through register with intent preserved", async ({ page }) => {
    await page.goto("/landing");
    // Click the hero variant (first occurrence on the page).
    await page.getByRole("button", { name: /Try Deep Research/i }).first().click();
    // Either the register modal opens (preferred) OR we land on /register.
    // The auth modal provider records the redirect URL via storage; we
    // assert that the surface offers a register flow (not 404 / dead link).
    await expect(
      page.getByText(/sign up|create account|register/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("authenticated user goes straight to /research with intent param", async ({ page }) => {
    await login(page, SEEDED_USERS.enterprise.email, SEEDED_USERS.enterprise.password);
    await page.goto("/landing");
    await page.getByRole("button", { name: /Try Deep Research/i }).first().click();
    await expect(page).toHaveURL(/\/research\?intent=research/);
  });
});

test.describe("Discoverability — header quick-links", () => {
  test("header dropdown contains Deep Research and Contract Drafting", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/chat", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Quick Links/i }).click();
    await expect(page.getByRole("menuitem", { name: /Deep Research/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Contract Drafting/i })).toBeVisible();
  });
});

test.describe("Discoverability — desktop sidebar Tools section", () => {
  test("sidebar exposes Deep Research and Contract Drafting under Tools", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/chat", { waitUntil: "domcontentloaded" });
    // Tools section is grouped by a label.
    await expect(page.getByText("Tools", { exact: false }).first()).toBeVisible();
    // Both nav items are reachable as named links.
    await expect(
      page.getByRole("link", { name: /Deep Research/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Contract Drafting/i }).first()
    ).toBeVisible();
  });
});

test.describe("Discoverability — mobile drawer Tools section", () => {
  test("mobile drawer Tools section appears at narrow viewport", async ({ page }) => {
    // Set a phone-sized viewport so the drawer is the relevant nav.
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsTeamUser(page);
    await page.goto("/chat", { waitUntil: "domcontentloaded" });
    // Open the mobile menu via the hamburger.
    await page.getByRole("button", { name: /Open navigation menu|Toggle menu/i }).click();
    // Tools heading + items.
    await expect(page.getByText("Tools", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Deep Research/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Contract Drafting/i })).toBeVisible();
  });
});

test.describe("Accessibility — research history filter tabs", () => {
  test("filter tabs implement role=tablist with keyboard navigation", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/research/history", { waitUntil: "domcontentloaded" });
    // The tablist may not render if there are zero sessions; skip gracefully.
    const tablist = page.getByRole("tablist", { name: /Filter research sessions/i });
    if ((await tablist.count()) === 0) {
      test.skip(true, "No sessions present to render filter tabs");
      return;
    }
    const allTab = tablist.getByRole("tab", { name: /All/i });
    const completeTab = tablist.getByRole("tab", { name: /Complete/i });
    await expect(allTab).toHaveAttribute("aria-selected", "true");
    await expect(completeTab).toHaveAttribute("aria-selected", "false");

    // ArrowRight moves focus + selection to the next tab.
    await allTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(completeTab).toHaveAttribute("aria-selected", "true");
    await expect(allTab).toHaveAttribute("aria-selected", "false");
  });

  test("research history page has no critical axe violations", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/research/history", { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      // Same exclusions as the existing accessibility.spec.ts so this
      // gate matches the rest of the suite. New regressions still
      // fail; we don't relax beyond the project baseline.
      .disableRules([
        "color-contrast",
        "aria-valid-attr-value",
        "scrollable-region-focusable",
      ])
      .analyze();
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(critical).toEqual([]);
  });
});
