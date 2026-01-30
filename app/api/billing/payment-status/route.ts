import { NextRequest, NextResponse } from "next/server";

import { getAuthHeader } from "../_auth";

const ADMIN_API_URL = process.env.ADMIN_API_URL || "http://localhost:8001";

export async function GET(request: NextRequest) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference required" },
        { status: 400 }
      );
    }

    // Forward to backend API
    const response = await fetch(
      `${ADMIN_API_URL}/api/v1/billing/payment-status?reference=${reference}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to check payment status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Payment status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
