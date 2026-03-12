import { test, expect } from "@playwright/test";
import { loginAsTeamUser } from "./utils/auth";

test.describe("Research Resume Flow", () => {
  test("should resume a failed research session from checkpoint", async ({ page }) => {
    await loginAsTeamUser(page);

    const sessionId = "session-resume-ui";
    let resumed = false;

    const failedSession = {
      session_id: sessionId,
      query: "Analyze VAT treatment",
      status: "error",
      phase: "research",
      clarifying_questions: null,
      research_brief: {
        id: "brief-1",
        original_query: "Analyze VAT treatment",
        clarifications: [],
        jurisdictions: ["Uganda"],
        document_types: ["legislation", "judgment"],
        time_scope: "current",
        topics: [
          {
            id: "topic-1",
            title: "VAT treatment",
            description: "Scope VAT rules",
            keywords: ["vat"],
            priority: 1,
            status: "pending",
          },
        ],
        report_format: "comprehensive",
        include_recommendations: true,
        created_at: "2026-03-12T10:00:00Z",
      },
      created_at: "2026-03-12T10:00:00Z",
      progress_percent: 45,
      current_step: "Checkpoint saved: writer",
      tokens_used: 123,
      error: "writer failed",
      graph_checkpoints: [
        {
          kind: "graph_checkpoint",
          node: "supervisor",
          phase: "research",
          finding_count: 1,
          has_brief: true,
          has_report: false,
          recorded_at: "2026-03-12T10:05:00Z",
        },
        {
          kind: "graph_checkpoint",
          node: "writer",
          phase: "writing",
          finding_count: 1,
          has_brief: true,
          has_report: false,
          recorded_at: "2026-03-12T10:06:00Z",
        },
      ],
    };

    const resumedSession = {
      ...failedSession,
      status: "researching",
      error: null,
      current_step: "Resuming from checkpoint: writer",
      progress_percent: 0,
    };

    await page.route(`**/api/v1/research/${sessionId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(resumed ? resumedSession : failedSession),
      });
    });

    await page.route(`**/api/v1/research/${sessionId}/resume`, async (route) => {
      resumed = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(resumedSession),
      });
    });

    await page.route(`**/api/v1/research/${sessionId}/stream`, async (route) => {
      await route.abort();
    });

    await page.goto(`/research?session=${sessionId}`);

    await expect(page.getByText("Research Failed")).toBeVisible();
    await expect(page.getByText("Graph Checkpoints")).toBeVisible();
    await expect(page.getByRole("button", { name: "Resume Research" })).toBeVisible();

    await page.getByRole("button", { name: "Resume Research" }).click();

    await expect(page.getByText("Execution in progress")).toBeVisible();
    await expect(page.getByText("Resumed from checkpoint")).toBeVisible();
    await expect(page.getByText(/Resuming from checkpoint: writer/i)).toBeVisible();
  });
});
