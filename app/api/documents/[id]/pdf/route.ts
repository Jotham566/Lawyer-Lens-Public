import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8003/api/v1";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const upstream = await fetch(`${BACKEND_URL}/public/documents/${id}/pdf`, {
      method: "GET",
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: "Failed to fetch PDF" },
        { status: upstream.status || 502 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/pdf");
    headers.set(
      "Content-Disposition",
      upstream.headers.get("Content-Disposition") || 'inline; filename="document.pdf"'
    );
    headers.set("Cache-Control", upstream.headers.get("Cache-Control") || "public, max-age=300");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }
}
