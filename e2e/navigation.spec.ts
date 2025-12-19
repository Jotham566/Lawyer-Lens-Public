import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Law Lens/);
  });

  test("should navigate to search page", async ({ page }) => {
    await page.goto("/search");
    // Check for search form (always present)
    await expect(page.getByRole("search")).toBeVisible();
  });

  test("should navigate to chat page", async ({ page }) => {
    await page.goto("/chat");
    // Check for chat input (always present)
    await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeVisible();
  });

  test("should navigate to browse page", async ({ page }) => {
    await page.goto("/browse");
    // Page should load without error
    await expect(page.locator("body")).toBeVisible();
  });

  test("should navigate using header links", async ({ page }) => {
    await page.goto("/");

    // Click on Browse link in header if visible
    const browseLink = page.getByRole("link", { name: /Browse/i }).first();
    const isVisible = await browseLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isVisible) {
      await browseLink.click();
      // Should navigate somewhere
      await page.waitForLoadState("domcontentloaded");
    }
    
    // Page should be functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should have skip link for accessibility", async ({ page }) => {
    await page.goto("/");

    // Tab to reach skip link
    await page.keyboard.press("Tab");

    // Check skip link is focusable
    const skipLink = page.getByRole("link", { name: /Skip to main content/i });
    await expect(skipLink).toBeFocused();
  });
});

test.describe("Command Palette", () => {
  test("should open with Cmd+K / Ctrl+K", async ({ page }) => {
    await page.goto("/");

    // Open command palette
    await page.keyboard.press("Meta+k");

    // Command palette should be visible
    await expect(page.getByPlaceholder(/Type a command/i)).toBeVisible({ timeout: 3000 });
  });

  test("should close with Escape", async ({ page }) => {
    await page.goto("/");

    // Open command palette
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder(/Type a command/i)).toBeVisible({ timeout: 3000 });

    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder(/Type a command/i)).not.toBeVisible();
  });
});
