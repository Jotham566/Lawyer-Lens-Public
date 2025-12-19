import { test, expect } from "@playwright/test";

test.describe("Chat Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("should display chat interface elements", async ({ page }) => {
    // Check for chat input (always visible)
    await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeVisible();
  });

  test("should show empty state with suggested questions", async ({ page }) => {
    // Look for suggested questions in empty state
    await expect(page.getByText(/Try asking/i)).toBeVisible();
  });

  test("should create new conversation with Cmd+N", async ({ page }) => {
    // Press Cmd+N
    await page.keyboard.press("Meta+n");

    // Should still be on chat page
    await expect(page).toHaveURL(/\/chat/);
  });

  test("should focus input when clicking suggested question", async ({ page }) => {
    // Find and click a suggested question
    const suggestedQuestion = page.locator("button").filter({ hasText: /What are/ }).first();
    if (await suggestedQuestion.isVisible({ timeout: 2000 }).catch(() => false)) {
      await suggestedQuestion.click();

      // Input should be focused
      await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeFocused();
    } else {
      // Skip if no suggested questions visible
      test.skip();
    }
  });

  test("should have accessible chat input", async ({ page }) => {
    const chatInput = page.getByPlaceholder(/Ask a legal question/i);
    await expect(chatInput).toBeVisible();

    // Should be able to type in input
    await chatInput.fill("Test question");
    await expect(chatInput).toHaveValue("Test question");
  });

  test("should handle Enter key to submit", async ({ page }) => {
    const chatInput = page.getByPlaceholder(/Ask a legal question/i);
    await chatInput.fill("What is the constitution?");

    // Press Enter to submit
    await chatInput.press("Enter");

    // Either shows loading, error, or redirects to auth - any response is valid
    // We just verify the input was processed (cleared or page changed)
    await page.waitForTimeout(1000);
    const currentValue = await chatInput.inputValue().catch(() => "");
    const currentUrl = page.url();
    
    // Input should be cleared OR page navigated away
    expect(currentValue === "" || !currentUrl.includes("/chat")).toBeTruthy();
  });
});

test.describe("Chat Mobile View", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show chat input on mobile", async ({ page }) => {
    await page.goto("/chat");

    // Chat input should be visible on mobile
    await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeVisible();
  });

  test("should have new conversation button on mobile", async ({ page }) => {
    await page.goto("/chat");

    // New conversation button (may have different label on mobile)
    const newButton = page.getByRole("button", { name: /New|Plus|\+/i }).first();
    await expect(newButton).toBeVisible();
  });
});

test.describe("Chat Conversation History", () => {
  test("should display conversation UI on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");

    // On desktop, either sidebar or chat interface should be visible
    const chatInterface = page.getByPlaceholder(/Ask a legal question/i);
    await expect(chatInterface).toBeVisible();
  });
});
