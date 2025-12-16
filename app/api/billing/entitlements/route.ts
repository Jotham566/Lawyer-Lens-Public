import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      // Return free tier defaults for unauthenticated users
      return NextResponse.json({
        tier: "free",
        features: {},
        usage: {},
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/billing/entitlements`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // Return free tier defaults on error
      return NextResponse.json({
        tier: "free",
        features: {},
        usage: {},
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching entitlements:", error);
    // Return free tier defaults on error
    return NextResponse.json({
      tier: "free",
      features: {},
      usage: {},
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
    });
  }
}
