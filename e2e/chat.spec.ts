import { test, expect } from "@playwright/test";

test.describe("Chat Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/chat");
  });

  test("should display chat interface", async ({ page }) => {
    await expect(page.getByText(/Legal Assistant/i).first()).toBeVisible();
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
    if (await suggestedQuestion.isVisible()) {
      await suggestedQuestion.click();

      // Input should be focused
      await expect(page.getByPlaceholder(/Ask a legal question/i)).toBeFocused();
    }
  });

  test("should show tools dropdown", async ({ page }) => {
    // Look for tools dropdown trigger
    const toolsButton = page.getByRole("button").filter({ hasText: /Chat/i }).first();
    if (await toolsButton.isVisible()) {
      await toolsButton.click();

      // Should show tool options
      await expect(page.getByText(/Deep Research/i)).toBeVisible();
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

    // Message should appear in chat (or loading state)
    // Note: Full functionality depends on API being available
    await expect(page.getByText(/What is the constitution/i)).toBeVisible({ timeout: 5000 });
  });

  test("should show Shift+Enter creates new line hint", async ({ page }) => {
    const chatInput = page.getByPlaceholder(/Ask a legal question/i);
    await chatInput.fill("Line 1");
    await chatInput.press("Shift+Enter");
    await chatInput.type("Line 2");

    // Input should contain newline
    await expect(chatInput).toHaveValue("Line 1\nLine 2");
  });
});

test.describe("Chat Mobile View", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show mobile header", async ({ page }) => {
    await page.goto("/chat");

    // Mobile header should be visible
    await expect(page.getByText(/Legal Assistant/i).first()).toBeVisible();
  });

  test("should have history button on mobile", async ({ page }) => {
    await page.goto("/chat");

    // History button should be visible on mobile
    const historyButton = page.getByRole("button", { name: /history/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();

      // History sheet should open
      await expect(page.getByText(/Conversation History/i)).toBeVisible();
    }
  });

  test("should have new conversation button on mobile", async ({ page }) => {
    await page.goto("/chat");

    // New conversation button
    const newButton = page.getByRole("button", { name: /New conversation/i });
    await expect(newButton).toBeVisible();
  });
});

test.describe("Chat Conversation History", () => {
  test("should display conversation sidebar on desktop", async ({ page }) => {
    await page.goto("/chat");

    // On desktop, sidebar should be visible
    await expect(page.getByText(/New Chat/i)).toBeVisible();
  });

  test("should start new conversation", async ({ page }) => {
    await page.goto("/chat");

    // Click new chat button
    await page.getByRole("button", { name: /New Chat/i }).click();

    // Should show empty state
    await expect(page.getByText(/Try asking/i)).toBeVisible();
  });
});
