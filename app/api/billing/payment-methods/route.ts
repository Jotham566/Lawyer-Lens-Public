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

    const response = await fetch(`${BACKEND_URL}/api/v1/billing/payment-methods`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ payment_methods: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json({ payment_methods: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/billing/payment-methods`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error adding payment method:", error);
    return NextResponse.json(
      { error: "Failed to add payment method" },
      { status: 500 }
    );
  }
}
