import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const API_BASE = "http://localhost:8003/api/v1";
const OUTPUTS = {
  research: "/tmp/phase6-research-kickoff.png",
  researchHistory: "/tmp/phase6-research-history.png",
  contracts: "/tmp/phase6-contracts-kickoff.png",
  contractSession: "/tmp/phase6-contract-session.png",
};

async function login(page, email, password) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const status = await page.evaluate(async ({ email, password, apiBase }) => {
    const response = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    return response.status;
  }, { email, password, apiBase: API_BASE });

  if (status !== 200) {
    throw new Error(`Login failed with status ${status}`);
  }
}

async function fetchJson(page, path) {
  return page.evaluate(async ({ path, apiBase }) => {
    const response = await fetch(`${apiBase}${path}`, { credentials: "include" });
    return {
      status: response.status,
      body: await response.json().catch(() => null),
    };
  }, { path, apiBase: API_BASE });
}

async function capture(page, path, outputPath) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: outputPath, fullPage: true });
  return {
    path,
    url: page.url(),
    title: await page.title(),
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  await login(page, "john.owner@acmelaw.com", "demo123");

  const result = {
    captures: {},
    recentContract: null,
  };

  result.captures.research = await capture(page, "/research", OUTPUTS.research);
  result.captures.researchHistory = await capture(page, "/research/history", OUTPUTS.researchHistory);
  result.captures.contracts = await capture(page, "/contracts", OUTPUTS.contracts);

  const contractsResponse = await fetchJson(page, "/contracts/my-contracts?limit=1");
  if (contractsResponse.status === 200 && Array.isArray(contractsResponse.body) && contractsResponse.body.length > 0) {
    const recent = contractsResponse.body[0];
    result.recentContract = {
      session_id: recent.session_id,
      title: recent.title,
      phase: recent.phase,
    };
    result.captures.contractSession = await capture(page, `/contracts?session=${recent.session_id}`, OUTPUTS.contractSession);
  }

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
