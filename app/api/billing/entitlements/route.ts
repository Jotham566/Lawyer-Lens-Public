import { NextRequest, NextResponse } from "next/server";
import { getAuthHeader } from "../_auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

// Free tier usage defaults - matches backend tier config
const FREE_TIER_DEFAULTS = {
  tier: "free",
  features: {
    basic_search: true,
    ai_chat: true,
    citations: true,
    deep_research: false,
    contract_drafting: false,
    contract_analysis: false,
    document_upload: true,
    export_pdf: true,
    export_docx: false,
    team_management: false,
    role_based_access: false,
    shared_workspaces: false,
    activity_logs: false,
    audit_logs: false,
    sso_saml: false,
    custom_integrations: false,
    api_access: false,
    dedicated_support: false,
  },
  usage: {
    ai_query: {
      display_name: "AI Queries",
      current: 0,
      limit: 50,
      is_unlimited: false,
      remaining: 50,
      percentage: 0,
      is_at_limit: false,
    },
    deep_research: {
      display_name: "Deep Research",
      current: 0,
      limit: 0,
      is_unlimited: false,
      remaining: 0,
      percentage: 0,
      is_at_limit: true,
    },
    contract_draft: {
      display_name: "Contract Drafts",
      current: 0,
      limit: 0,
      is_unlimited: false,
      remaining: 0,
      percentage: 0,
      is_at_limit: true,
    },
    storage_gb: {
      display_name: "Storage (GB)",
      current: 0,
      limit: 1,
      is_unlimited: false,
      remaining: 1,
      percentage: 0,
      is_at_limit: false,
    },
  },
  period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
  period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      // Return free tier defaults for unauthenticated users
      return NextResponse.json(FREE_TIER_DEFAULTS);
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/billing/entitlements`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Return free tier defaults on error
      console.error("Backend entitlements call failed:", response.status, response.statusText);
      return NextResponse.json(FREE_TIER_DEFAULTS);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching entitlements:", error);
    // Return free tier defaults on error
    return NextResponse.json(FREE_TIER_DEFAULTS);
  }
}
