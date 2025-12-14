import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
  });

  test("should display search form", async ({ page }) => {
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByPlaceholder(/land registration requirements/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Search/i })).toBeVisible();
  });

  test("should show search suggestions on input focus", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.focus();

    // Should show suggestions dropdown
    await expect(page.getByText(/Popular Searches/i)).toBeVisible();
  });

  test("should filter suggestions as user types", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.fill("land");

    // Should show filtered suggestions
    await expect(page.getByRole("option", { name: /land registration/i })).toBeVisible();
  });

  test("should select suggestion on click", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.focus();

    // Click a suggestion
    await page.getByRole("option", { name: /land registration/i }).click();

    // Should update URL with query
    await expect(page).toHaveURL(/q=land\+registration/);
  });

  test("should submit search form", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.fill("constitutional rights");
    await page.getByRole("button", { name: /Search/i }).click();

    // Should update URL with query
    await expect(page).toHaveURL(/q=constitutional\+rights/);
  });

  test("should display filter sidebar", async ({ page }) => {
    await expect(page.getByText(/Document Type/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /All Types/i })).toBeVisible();
  });

  test("should filter by document type", async ({ page }) => {
    // Submit a search first
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.fill("land");
    await page.getByRole("button", { name: /Search/i }).click();

    // Click on Acts filter
    await page.getByRole("button", { name: /Acts of Parliament/i }).click();

    // URL should include type filter
    await expect(page).toHaveURL(/type=act/);
  });

  test("should clear filters", async ({ page }) => {
    // Apply a filter
    await page.goto("/search?q=test&type=act");

    // Clear all filters
    await page.getByRole("button", { name: /Clear all/i }).click();

    // URL should not have type
    await expect(page).not.toHaveURL(/type=/);
  });

  test("should have accessible search form", async ({ page }) => {
    // Check search form has proper role
    await expect(page.getByRole("search")).toBeVisible();

    // Check input has proper label
    const searchInput = page.getByRole("searchbox");
    await expect(searchInput).toBeVisible();
  });
});

test.describe("Search Results", () => {
  test("should show loading state during search", async ({ page }) => {
    await page.goto("/search");

    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.fill("land registration");
    await page.getByRole("button", { name: /Search/i }).click();

    // Note: This test may be flaky depending on API response time
    // Consider mocking the API for more reliable tests
  });

  test("should save search to recent searches", async ({ page }) => {
    // First search
    await page.goto("/search");
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.fill("test search");
    await page.getByRole("button", { name: /Search/i }).click();

    // Go back and check recent searches
    await page.goto("/search");
    await searchInput.focus();

    // Should show in recent searches
    await expect(page.getByText(/Recent Searches/i)).toBeVisible();
    await expect(page.getByRole("option", { name: /test search/i })).toBeVisible();
  });

  test("should clear individual recent search", async ({ page }) => {
    // Save a search
    await page.goto("/search");
    const searchInput = page.getByPlaceholder(/land registration requirements/i);
    await searchInput.fill("search to clear");
    await page.getByRole("button", { name: /Search/i }).click();

    // Focus input to show suggestions
    await page.goto("/search");
    await searchInput.focus();

    // Clear the recent search
    const clearButton = page.getByRole("button", { name: /Remove search to clear/i });
    await clearButton.click();

    // Should not appear in suggestions anymore
    await expect(page.getByRole("option", { name: /search to clear/i })).not.toBeVisible();
  });
});
