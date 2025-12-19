import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("should display search form", async ({ page }) => {
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.locator("#search-input")).toBeVisible();
    await expect(page.getByRole("button", { name: /Search/i })).toBeVisible();
  });

  test("should show search suggestions on input focus", async ({ page }) => {
    const searchInput = page.locator("#search-input");
    await searchInput.focus();

    // Should show suggestions dropdown (Popular or Recent)
    const suggestions = page.getByText(/Popular Searches|Recent Searches/i);
    await expect(suggestions.first()).toBeVisible({ timeout: 3000 });
  });

  test("should submit search form", async ({ page }) => {
    const searchInput = page.locator("#search-input");
    await searchInput.fill("constitutional rights");
    await page.getByRole("button", { name: /Search/i }).click();

    // Should update URL with query
    await expect(page).toHaveURL(/q=constitutional/);
  });

  test("should have accessible search form", async ({ page }) => {
    // Check search form has proper role
    await expect(page.getByRole("search")).toBeVisible();

    // Check main search input has proper attributes
    const searchInput = page.locator("#search-input");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("aria-label", /search/i);
  });
});

test.describe("Search Results", () => {
  test("should navigate to results page on search", async ({ page }) => {
    await page.goto("/search");

    const searchInput = page.locator("#search-input");
    await searchInput.fill("land registration");
    await page.getByRole("button", { name: /Search/i }).click();

    // Should navigate to results
    await expect(page).toHaveURL(/q=land/);
  });

  test("should preserve search query in URL", async ({ page }) => {
    await page.goto("/search?q=test+query");

    // Page should load with query
    await expect(page).toHaveURL(/q=test/);
  });
});
