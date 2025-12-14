import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Law Lens/);
  });

  test("should navigate to search page", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /Search Legal Documents/i })).toBeVisible();
  });

  test("should navigate to chat page", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByText(/Legal Assistant/i).first()).toBeVisible();
  });

  test("should navigate to browse page", async ({ page }) => {
    await page.goto("/browse");
    await expect(page.getByRole("heading", { name: /Browse Legal Documents/i })).toBeVisible();
  });

  test("should navigate using header links", async ({ page }) => {
    await page.goto("/");

    // Click on Browse link in header
    await page.getByRole("link", { name: /Browse/i }).first().click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test("should have working skip link for accessibility", async ({ page }) => {
    await page.goto("/");

    // Tab to reach skip link
    await page.keyboard.press("Tab");

    // Check skip link becomes visible
    const skipLink = page.getByRole("link", { name: /Skip to main content/i });
    await expect(skipLink).toBeVisible();

    // Click skip link
    await skipLink.click();

    // Main content should have focus
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });
});

test.describe("Command Palette", () => {
  test("should open with Cmd+K / Ctrl+K", async ({ page }) => {
    await page.goto("/");

    // Open command palette
    await page.keyboard.press("Meta+k");

    // Command palette should be visible
    await expect(page.getByPlaceholder(/Type a command or search/i)).toBeVisible();
  });

  test("should navigate to search from command palette", async ({ page }) => {
    await page.goto("/");

    // Open command palette
    await page.keyboard.press("Meta+k");

    // Type and select search option
    await page.getByPlaceholder(/Type a command or search/i).fill("search");
    await page.getByRole("option", { name: /Search Documents/i }).click();

    // Should navigate to search page
    await expect(page).toHaveURL(/\/search/);
  });

  test("should close with Escape", async ({ page }) => {
    await page.goto("/");

    // Open command palette
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/Type a command or search/i)).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder(/Type a command or search/i)).not.toBeVisible();
  });
});
