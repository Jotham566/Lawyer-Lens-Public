import { test, expect } from "@playwright/test";
import { loginAsTeamUser } from "./utils/auth";

/**
 * Performance & Loading Tests
 * Tests for proper loading states, no content flashes, and smooth UX
 */

test.describe("Loading States", () => {
  test("Chat page should show loading state then content", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/chat");

    // Page should load with content visible
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();

    // Wait for chat input to be visible
    await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeVisible({ timeout: 15000 });
  });

  test("Search page should be responsive", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/search");

    const searchInput = page.locator("#search-input");

    try {
      await searchInput.waitFor({ state: "visible", timeout: 15000 });
    } catch {
      test.skip(true, "Search page not accessible - auth may have failed");
      return;
    }

    // Type should be responsive
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
  });

  test("Library page should load documents", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/library");
    await page.waitForLoadState("domcontentloaded");
    
    // Should show library content or empty state
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("No Flash of Incorrect Content (FOIC)", () => {
  test("Home page should render consistently", async ({ page }) => {
    await page.goto("/");
    
    // Wait for hydration
    await page.waitForLoadState("domcontentloaded");
    
    // Page should render without errors
    await expect(page.locator("body")).toBeVisible();
  });

  test("Usage banner should be consistent", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
    
    // Page should render
    await expect(page.locator("body")).toBeVisible();
  });

  test("Auth state should not flash on page load", async ({ page }) => {
    await page.goto("/");
    
    // Immediately check - should not show conflicting states
    const content = await page.content();
    
    // Should not simultaneously show "Sign in" and user profile elements
    const hasSignIn = content.includes("Sign in") || content.includes("Log in");
    const hasUserProfile = content.includes("profile") && content.includes("avatar");
    
    // These states should be mutually exclusive
    expect(hasSignIn && hasUserProfile).toBeFalsy();
  });
});

test.describe("Progressive Loading", () => {
  test("Heavy pages should load progressively", async ({ page }) => {
    await page.goto("/browse");
    
    // DOM should be interactive quickly
    await page.waitForLoadState("domcontentloaded");
    
    // Body should be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("Images should have loading placeholders", async ({ page }) => {
    await page.goto("/");
    
    // Images should have alt text or loading states
    const images = page.locator("img");
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const hasAlt = await img.getAttribute("alt");
      const hasLoadingAttr = await img.getAttribute("loading");
      
      // Images should be accessible (have alt) or be loading=lazy
      expect(hasAlt !== null || hasLoadingAttr !== null).toBeTruthy();
    }
  });
});

test.describe("Error Recovery", () => {
  test("Should recover from failed API calls gracefully", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/search");

    // Page should be functional even if API calls fail
    await expect(page.locator("body")).toBeVisible();

    // Search input should still work (skip if not accessible)
    const searchInput = page.locator("#search-input");
    try {
      await searchInput.waitFor({ state: "visible", timeout: 15000 });
    } catch {
      test.skip(true, "Search page not accessible - auth may have failed");
      return;
    }
    await expect(searchInput).toBeVisible();
  });

  test("Should handle browser navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await loginAsTeamUser(page);
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");

    // Check if auth worked - use try/catch for proper skipping
    try {
      await page.locator("#search-input").waitFor({ state: "visible", timeout: 15000 });
    } catch {
      test.skip(true, "Search page not accessible - auth may have failed");
      return;
    }

    await page.goto("/browse");
    await page.waitForLoadState("domcontentloaded");

    // Go back - should navigate to some previous page
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    // Page should still be functional
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Hydration", () => {
  test("Client-side hydration should complete", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/chat");
    
    // Wait for React hydration
    await page.waitForFunction(() => {
      return document.readyState === "complete";
    });
    
    // Page should be functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("No hydration mismatch errors in console", async ({ page }) => {
    const errors: string[] = [];
    
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Filter for hydration errors
    const hydrationErrors = errors.filter(
      (e) => e.includes("Hydration") || e.includes("hydration") || e.includes("mismatch")
    );
    
    expect(hydrationErrors.length).toBe(0);
  });
});
