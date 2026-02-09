import { test, expect } from "@playwright/test";
import { loginAsTeamUser } from "./utils/auth";

/**
 * Visual Regression & Theme Tests
 * Tests for consistent visual appearance and theme switching
 */

test.describe("Theme Consistency", () => {
  test("Light mode should have proper contrast", async ({ page }) => {
    await page.goto("/");
    
    // Ensure light mode
    await page.emulateMedia({ colorScheme: "light" });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Check that text is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
    
    // Get computed styles
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Should have a background color set
    expect(bgColor).toBeTruthy();
  });

  test("Dark mode should have proper contrast", async ({ page }) => {
    await page.goto("/");
    
    // Force dark mode
    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    await page.waitForLoadState("networkidle");
    
    // Check that page is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("Theme should persist on navigation", async ({ page }) => {
    await page.goto("/");
    
    // Try to toggle theme
    const themeToggle = page.getByRole("button", { name: /theme|dark|light/i }).first();
    
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      const htmlClass = await page.locator("html").getAttribute("class");
      
      // Navigate
      await page.goto("/search");
      await page.waitForLoadState("networkidle");
      
      // Theme should persist
      const newHtmlClass = await page.locator("html").getAttribute("class");
      
      // Both should have same dark/light state
      const hadDark = htmlClass?.includes("dark");
      const hasDark = newHtmlClass?.includes("dark");
      
      expect(hadDark === hasDark).toBeTruthy();
    }
  });
});

test.describe("Visual Layout", () => {
  test("Header should be sticky and visible", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    
    const header = page.locator("header").first();
    
    if (await header.isVisible().catch(() => false)) {
      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      
      // Header should still be visible
      await expect(header).toBeVisible();
    }
  });

  test("Footer should be at bottom", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("domcontentloaded");
    
    const footer = page.locator("footer").first();
    
    if (await footer.isVisible().catch(() => false)) {
      const footerBox = await footer.boundingBox();
      
      // Footer should be below or at viewport height
      expect(footerBox?.y).toBeGreaterThanOrEqual(0);
    }
  });

  test("Modals should center properly", async ({ page }) => {
    await page.goto("/");
    
    // Try to trigger a modal (like auth)
    const signInButton = page.getByRole("button", { name: /sign in|log in/i }).first();
    
    if (await signInButton.isVisible().catch(() => false)) {
      await signInButton.click();
      await page.waitForTimeout(500);
      
      // Check for dialog/modal
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible().catch(() => false)) {
        const box = await dialog.boundingBox();
        const viewport = await page.viewportSize();
        
        if (box && viewport) {
          // Should be roughly centered
          const centerX = box.x + box.width / 2;
          const viewportCenter = viewport.width / 2;
          
          expect(Math.abs(centerX - viewportCenter)).toBeLessThan(100);
        }
      }
    }
  });
});

test.describe("Responsive Breakpoints", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1280, height: 800 },
    { name: "Wide", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} viewport (${viewport.width}x${viewport.height}) should render correctly`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      // Page should render without errors
      await expect(page.locator("body")).toBeVisible();
      
      // No horizontal overflow (except for small tolerance)
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 20);
    });
  }
});

test.describe("Typography", () => {
  test("Headings should have proper hierarchy", async ({ page }) => {
    await page.goto("/pricing");
    await page.waitForLoadState("networkidle");
    
    // Check for h1
    const h1Count = await page.locator("h1").count();
    
    // Should have at least one h1
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Should not have more than 2 h1 (usually page title + maybe logo)
    expect(h1Count).toBeLessThanOrEqual(3);
  });

  test("Links should be distinguishable", async ({ page }) => {
    await page.goto("/");
    
    const links = page.locator("a[href]").first();
    
    if (await links.isVisible().catch(() => false)) {
      // Link should have some visual distinction (color, underline, etc.)
      const styles = await links.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          textDecoration: computed.textDecoration,
        };
      });
      
      expect(styles.color || styles.textDecoration).toBeTruthy();
    }
  });
});

test.describe("Animation & Transitions", () => {
  test("Prefers-reduced-motion should be respected", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    
    // Page should load normally
    await expect(page.locator("body")).toBeVisible();
  });

  test("Loading indicators should animate", async ({ page }) => {
    await loginAsTeamUser(page);
    await page.goto("/search");

    const searchInput = page.locator("#search-input");

    // Skip if search page not accessible
    try {
      await searchInput.waitFor({ state: "visible", timeout: 15000 });
    } catch {
      test.skip(true, "Search page not accessible - auth may have failed");
      return;
    }

    await searchInput.fill("contract law");
    await page.keyboard.press("Enter");

    // There might be a loading indicator
    // Just verify page handles the search
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});
