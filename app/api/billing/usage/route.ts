import { NextRequest, NextResponse } from "next/server";

import { getAuthHeader } from "../_auth";

// INTERNAL_API_URL includes /api/v1 suffix in production
const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8003/api/v1";

export async function GET(request: NextRequest) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/billing/usage`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
