import { NextRequest, NextResponse } from "next/server";

import { getAuthHeader } from "../_auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

export async function GET(request: NextRequest) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/billing/invoices`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ invoices: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ invoices: [] });
  }
}
