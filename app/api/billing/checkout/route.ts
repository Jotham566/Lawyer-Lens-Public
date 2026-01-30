import { NextRequest, NextResponse } from "next/server";

import { getAuthHeader } from "../_auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Handle both old format (plan_id) and new format (tier)
    const tier = body.tier || body.plan_id;
    const billingCycle = body.billingCycle || (body.billing_interval === "yearly" ? "annual" : "monthly");
    const seats = body.seats || 1;

    // Transform frontend checkout request to backend format
    const checkoutData = {
      tier,
      billing_cycle: billingCycle,
      quantity: seats,
      payment_method: body.paymentMethod || body.payment_method || "card",
      phone_number: body.phoneNumber || body.phone_number,
      success_url: `${appUrl}/billing/success?tier=${tier}`,
      cancel_url: `${appUrl}/pricing`,
      pending_url: `${appUrl}/billing/pending`,
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/billing/checkout`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Return checkout URL for redirect or pending status for mobile money
    return NextResponse.json({
      checkoutUrl: data.checkout_url,
      payment_url: data.checkout_url, // backwards compatibility
      session_id: data.session_id,
      reference: data.reference,
      status: data.status,
    });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
