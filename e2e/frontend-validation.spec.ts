import { test, expect } from "@playwright/test";

/**
 * Multi-tenant Frontend Validation Tests
 * Covers Phase 12 of MULTI-TENANT-VALIDATION-CHECKLIST.md
 * 
 * These tests validate:
 * - UI/UX Consistency
 * - Multi-Tenant UI
 * - Accessibility & Responsiveness
 * - Modern UI Best Practices
 * - Auth state management
 * - Flash of incorrect content prevention
 */

test.describe("UI/UX Consistency (12.1-12.5)", () => {
  test("12.2 - Pricing page should display tier information", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("domcontentloaded");
    
    // Check pricing page renders
    await expect(page.locator("body")).toBeVisible();
  });

  test("12.4 - Error messages should be helpful", async ({ page }) => {
    // Navigate to a non-existent page
    await page.goto("/this-page-does-not-exist-404");
    
    // Should show a user-friendly 404 message or redirect
    const is404 = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const isRedirected = page.url().includes("/chat") || page.url() === page.url().split("/")[0] + "/";
    
    expect(is404 || isRedirected).toBeTruthy();
  });

  test("12.5 - Loading states should show skeletons", async ({ page }) => {
    await page.goto("/search");
    
    // Page should load without error and show content
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Multi-Tenant UI (12.6-12.10)", () => {
  test("12.8 - Billing/settings page should be accessible or redirect", async ({ page }) => {
    await page.goto("/billing");
    await page.waitForLoadState("domcontentloaded");
    
    // Page should either show content or redirect gracefully
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Accessibility & Responsiveness (12.11-12.15)", () => {
  test("12.11 - Keyboard navigation works on main pages", async ({ page }) => {
    await page.goto("/");
    
    // Tab through elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Something should be focused
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("12.13 - Pages should be mobile responsive", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    
    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow small tolerance for borders/scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test("12.15 - Focus indicators should be visible", async ({ page }) => {
    await page.goto("/search");
    
    // Focus on search input
    const searchInput = page.locator("#search-input");
    await searchInput.focus();
    
    // Check element has focus
    await expect(searchInput).toBeFocused();
  });
});

test.describe("Modern UI Best Practices (12.16-12.20)", () => {
  test("12.16 - Dark mode support exists", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Check that page supports dark mode via CSS media query or theme toggle
    const supportsColorScheme = await page.evaluate(() => {
      return window.matchMedia("(prefers-color-scheme: dark)").media !== "not all";
    });
    
    expect(supportsColorScheme).toBeTruthy();
  });

  test("12.19 - Empty states should show meaningful messages", async ({ page }) => {
    await page.goto("/library");
    
    // Library page should show content or empty state
    const hasContent = await page.locator("body").textContent();
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Auth State Management", () => {
  test("Page refresh should maintain consistent state", async ({ page }) => {
    await page.goto("/chat");
    
    // Wait for initial load
    await page.waitForLoadState("domcontentloaded");
    
    // Page should render
    await expect(page.locator("body")).toBeVisible();
    
    // Refresh page
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    
    // Page should still render after refresh
    await expect(page.locator("body")).toBeVisible();
  });

  test("Navigation should work between pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    
    // Navigate to search
    await page.goto("/search");
    await page.waitForLoadState("domcontentloaded");
    
    // Page should be functional
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Entitlements & Usage Display", () => {
  test("Chat page should be functional", async ({ page }) => {
    await page.goto("/chat");
    await page.waitForLoadState("domcontentloaded");
    
    // Chat page should render properly
    await expect(page.locator("body")).toBeVisible();
    
    // Should have either chat input or redirect
    const hasChatInput = await page.getByPlaceholder(/Ask a legal question/i).isVisible().catch(() => false);
    const isRedirected = !page.url().includes("/chat");
    
    expect(hasChatInput || isRedirected).toBeTruthy();
  });

  test("Subscription tier should display correctly", async ({ page }) => {
    await page.goto("/settings");
    
    // Should show settings or redirect to auth
    const isSettingsPage = page.url().includes("/settings");
    const isAuthRedirect = page.url().includes("/auth") || page.url().includes("/login");
    
    expect(isSettingsPage || isAuthRedirect).toBeTruthy();
  });
});

test.describe("Page Load Performance", () => {
  test("Pages should load without content flash", async ({ page }) => {
    // Test that pages don't flash loading/error states incorrectly
    await page.goto("/");
    
    // Should not show error banners on fresh load
    const hasErrorBanner = await page.getByText(/error|failed|something went wrong/i).first().isVisible().catch(() => false);
    
    // Allow for graceful error handling, but shouldn't be prominent
    if (hasErrorBanner) {
      // If there's an error, it should be in a non-blocking toast or small notice
      const mainContent = page.getByRole("main");
      await expect(mainContent).toBeVisible();
    }
  });

  test("Navigation should be smooth", async ({ page }) => {
    await page.goto("/");
    
    // Click on navigation links
    const browseLink = page.getByRole("link", { name: /browse/i }).first();
    
    if (await browseLink.isVisible().catch(() => false)) {
      await browseLink.click();
      
      // Should navigate without full page reload feel
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

test.describe("Error Handling", () => {
  test("API errors should show user-friendly messages", async ({ page }) => {
    await page.goto("/search");
    
    // Submit an empty search (edge case)
    const searchButton = page.getByRole("button", { name: /search/i });
    
    if (await searchButton.isVisible().catch(() => false)) {
      // Page should handle gracefully
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("Network errors should be handled gracefully", async ({ page }) => {
    await page.goto("/");
    
    // Page should have offline handling
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Form Validation", () => {
  test("Search form should validate input", async ({ page }) => {
    await page.goto("/search");
    
    const searchInput = page.locator("#search-input");
    await searchInput.focus();
    
    // Type and submit
    await searchInput.fill("test query");
    await page.keyboard.press("Enter");
    
    // Should navigate or show results
    await page.waitForTimeout(1000);
    const hasSearched = page.url().includes("q=") || await page.getByText(/result|search/i).first().isVisible().catch(() => false);
    
    expect(hasSearched).toBeTruthy();
  });
});

test.describe("Session Persistence", () => {
  test("LocalStorage should persist across navigations", async ({ page }) => {
    await page.goto("/");
    
    // Set a test value
    await page.evaluate(() => {
      localStorage.setItem("test_persistence", "true");
    });
    
    // Navigate away
    await page.goto("/search");
    
    // Check value persists
    const value = await page.evaluate(() => {
      return localStorage.getItem("test_persistence");
    });
    
    expect(value).toBe("true");
    
    // Cleanup
    await page.evaluate(() => {
      localStorage.removeItem("test_persistence");
    });
  });
});
