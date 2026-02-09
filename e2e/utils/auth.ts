import { expect, type Page } from "@playwright/test";

export const SEEDED_USERS = {
  free: { email: "free.user@example.com", password: "demo123" },
  professional: { email: "solo.lawyer@lawoffice.com", password: "demo123" },
  team: { email: "john.owner@acmelaw.com", password: "demo123" },
  enterprise: { email: "ceo@globalcorp.com", password: "demo123" },
};

export async function login(page: Page, email: string, password: string) {
  await page.goto("/");
  const status = await page.evaluate(async ({ email, password }) => {
    const response = await fetch("http://localhost:8003/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    return response.status;
  }, { email, password });
  expect(status).toBe(200);
  const authStatus = await page.evaluate(async () => {
    const response = await fetch("http://localhost:8003/api/v1/auth/me", {
      credentials: "include",
    });
    return response.status;
  });
  expect(authStatus).toBe(200);
  await expect.poll(async () => {
    const cookies = await page.context().cookies("http://localhost:3001");
    return cookies.find((cookie) => cookie.name === "auth_token")?.value ?? "";
  }, { timeout: 10000 }).not.toBe("");
}

export async function loginAsTeamUser(page: Page) {
  const { email, password } = SEEDED_USERS.team;
  await login(page, email, password);
}

export async function loginAsTeamUserAndGoto(page: Page, path: string) {
  await loginAsTeamUser(page);
  await page.goto(path);
}
