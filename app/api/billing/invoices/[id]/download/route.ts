import { NextRequest, NextResponse } from "next/server";

import { getAuthHeader } from "../../../_auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8003";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = await getAuthHeader(request);

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const response = await fetch(
      `${BACKEND_URL}/api/v1/billing/invoices/${id}/pdf`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Invoice not found or PDF generation failed" },
        { status: response.status }
      );
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error downloading invoice:", error);
    return NextResponse.json(
      { error: "Failed to download invoice" },
      { status: 500 }
    );
  }
}
