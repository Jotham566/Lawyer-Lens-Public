import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8003/api/v1";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Use redirect: "manual" so we can handle 307 redirects ourselves.
    // The backend returns 307 → CloudFront/S3 presigned URL for production PDFs.
    // If we let fetch() auto-follow the redirect, the request to CloudFront/S3
    // may fail with 403 due to OAC restrictions or missing auth headers.
    // Instead, we fetch the redirect target server-side and stream the PDF back.
    const upstream = await fetch(`${BACKEND_URL}/public/documents/${id}/pdf`, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
    });

    // Handle 307/302 redirects — fetch the PDF from the redirect target server-side
    if (upstream.status === 307 || upstream.status === 302 || upstream.status === 301) {
      const redirectUrl = upstream.headers.get("Location");
      if (!redirectUrl) {
        return NextResponse.json(
          { error: "Redirect without Location header" },
          { status: 502 }
        );
      }

      // Fetch the actual PDF from the redirect target (CloudFront/S3)
      const pdfResponse = await fetch(redirectUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!pdfResponse.ok || !pdfResponse.body) {
        console.error(
          `PDF fetch from redirect target failed: ${pdfResponse.status} ${pdfResponse.statusText} (url: ${redirectUrl.substring(0, 100)}...)`
        );
        return NextResponse.json(
          { error: `PDF storage returned ${pdfResponse.status}` },
          { status: pdfResponse.status || 502 }
        );
      }

      const headers = new Headers();
      headers.set("Content-Type", pdfResponse.headers.get("Content-Type") || "application/pdf");
      headers.set(
        "Content-Disposition",
        pdfResponse.headers.get("Content-Disposition") || 'inline; filename="document.pdf"'
      );
      headers.set("Cache-Control", "public, max-age=300");
      const contentLength = pdfResponse.headers.get("Content-Length");
      if (contentLength) {
        headers.set("Content-Length", contentLength);
      }

      return new NextResponse(pdfResponse.body, {
        status: 200,
        headers,
      });
    }

    // Non-redirect responses (local MinIO streaming, errors)
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
  } catch (err) {
    console.error("PDF proxy error:", err);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }
}
