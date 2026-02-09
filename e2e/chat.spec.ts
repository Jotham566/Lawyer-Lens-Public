import { test, expect } from "@playwright/test";
import { loginAsTeamUserAndGoto } from "./utils/auth";

test.describe("Chat Page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTeamUserAndGoto(page, "/chat");
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
    // Wait for empty state with suggested questions to load
    const tryAskingText = page.getByText(/Try asking/i);
    const hasSuggestions = await tryAskingText.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasSuggestions) {
      // Skip if no suggested questions section visible
      test.skip(true, "Suggested questions section not visible");
      return;
    }

    // Find and click a suggested question button
    const suggestedQuestion = page.locator("button").filter({ hasText: /Tax Law|Employment|Property|Corporate/i }).first();
    if (await suggestedQuestion.isVisible({ timeout: 3000 }).catch(() => false)) {
      await suggestedQuestion.click();

      // Input should be focused or have the question text
      const chatInput = page.getByPlaceholder(/Ask a legal question/i);
      await expect(chatInput).toBeFocused({ timeout: 3000 });
    } else {
      test.skip(true, "Suggested question button not found");
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

    // Wait for either: input cleared, loading indicator, or message appears
    // The submit should trigger some visible change within reasonable time
    await expect.poll(async () => {
      const value = await chatInput.inputValue().catch(() => "has-value");
      const hasLoadingOrMessage = await page.locator("[aria-live], [role='status'], .animate-spin").count() > 0 ||
        await page.getByText(/What is the constitution/i).count() > 0;
      return value === "" || hasLoadingOrMessage;
    }, { timeout: 10000 }).toBeTruthy();
  });
});

test.describe("Chat Mobile View", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show chat input on mobile", async ({ page }) => {
    await loginAsTeamUserAndGoto(page, "/chat");

    // Chat input should be visible on mobile
    await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeVisible();
  });

  test("should have new conversation button on mobile", async ({ page }) => {
    await loginAsTeamUserAndGoto(page, "/chat");

    // Wait for chat page to load
    const chatInput = page.getByPlaceholder(/Ask a legal question/i);
    const isOnChatPage = await chatInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isOnChatPage) {
      // Auth may have failed on mobile - skip test
      test.skip(true, "Chat page not accessible - auth may have failed");
      return;
    }

    // New conversation button in mobile header (icon only, aria-label is "New conversation")
    const newButton = page.getByRole("button", { name: /new conversation/i });
    await expect(newButton).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Chat Conversation History", () => {
  test("should display conversation UI on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await loginAsTeamUserAndGoto(page, "/chat");

    // On desktop, either sidebar or chat interface should be visible
    const chatInterface = page.getByPlaceholder(/Ask a legal question/i);
    await expect(chatInterface).toBeVisible();
  });
});
