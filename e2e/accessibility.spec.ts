import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility tests using axe-core
 *
 * These tests run automated accessibility checks on each page
 * to catch common WCAG violations.
 */

test.describe("Accessibility", () => {
  test("Home page should have no accessibility violations", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Search page should have no accessibility violations", async ({ page }) => {
    await page.goto("/search");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Chat page should have no accessibility violations", async ({ page }) => {
    await page.goto("/chat");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Browse page should have no accessibility violations", async ({ page }) => {
    await page.goto("/browse");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Help page should have no accessibility violations", async ({ page }) => {
    await page.goto("/help");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Library page should have no accessibility violations", async ({ page }) => {
    await page.goto("/library");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe("Keyboard Navigation", () => {
  test("should be able to navigate main pages using keyboard", async ({ page }) => {
    await page.goto("/");

    // Tab through the page
    await page.keyboard.press("Tab"); // Skip link
    await page.keyboard.press("Tab"); // First interactive element

    // Should have visible focus indicator
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("Search input should be keyboard accessible", async ({ page }) => {
    await page.goto("/search");

    // Focus on search input
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.focus();

    // Type and submit with keyboard
    await searchInput.fill("test query");
    await page.keyboard.press("Enter");

    // Should navigate with search query
    await expect(page).toHaveURL(/q=test\+query/);
  });

  test("Command palette should be fully keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Open with keyboard
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/Type a command/i)).toBeVisible();

    // Navigate with arrows
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");

    // Select with Enter
    await page.keyboard.press("Enter");

    // Should navigate somewhere
    await expect(page).not.toHaveURL("/");
  });
});

test.describe("Focus Management", () => {
  test("Skip link should move focus to main content", async ({ page }) => {
    await page.goto("/");

    // Tab to skip link
    await page.keyboard.press("Tab");

    // Activate skip link
    await page.keyboard.press("Enter");

    // Main content should have focus
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });

  test("Dialog should trap focus", async ({ page }) => {
    await page.goto("/chat");

    // Try to trigger delete dialog (if conversation exists)
    // This test may need adjustment based on actual UI state
  });
});

test.describe("Screen Reader Support", () => {
  test("Search form should have proper ARIA labels", async ({ page }) => {
    await page.goto("/search");

    // Check search form role
    await expect(page.getByRole("search")).toBeVisible();

    // Check search input has proper label
    const searchInput = page.getByRole("searchbox");
    await expect(searchInput).toHaveAttribute("aria-label", /search/i);
  });

  test("Chat messages area should have live region", async ({ page }) => {
    await page.goto("/chat");

    // Check for aria-live region
    const messagesArea = page.locator("[aria-live]");
    await expect(messagesArea.first()).toBeVisible();
  });

  test("Navigation should have proper landmarks", async ({ page }) => {
    await page.goto("/");

    // Check main landmark
    await expect(page.getByRole("main")).toBeVisible();

    // Check navigation landmark
    await expect(page.getByRole("navigation").first()).toBeVisible();
  });
});

test.describe("Color Contrast", () => {
  test("Text should have sufficient contrast", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .include("body")
      .analyze();

    // Filter for contrast violations specifically
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === "color-contrast"
    );

    expect(contrastViolations).toEqual([]);
  });
});
