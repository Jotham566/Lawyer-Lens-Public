import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

/**
 * Proxy endpoint for beta waitlist status
 * 
 * @route GET /api/v1/beta/waitlist/status?email={email}
 * @description Proxies requests to backend API to check waitlist status
 * @backend Integration required: Backend must implement GET /api/v1/beta/waitlist/status
 * @returns WaitlistStatus { email, position, total_waiting, status, created_at, invited_at? }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Proxy request to backend
    const backendUrl = `${BACKEND_URL}/api/v1/beta/waitlist/status?email=${encodeURIComponent(email)}`;
    
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: "Failed to check waitlist status" 
      }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching waitlist status:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
