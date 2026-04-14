import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8003/api/v1";

/**
 * Public PDF download route.
 *
 * Backend returns a 307 whose `Location` points at either CloudFront (prod)
 * or a presigned S3 URL (fallback / dev). We forward that redirect to the
 * browser AS-IS so the browser fetches the PDF bytes directly. Earlier
 * versions of this route manually followed the redirect server-side and
 * proxied the body, which made every byte hop Uganda → us-east-1 (Next.js)
 * → S3 → back through Next.js → browser, and bypassed CloudFront edge
 * caching entirely.
 *
 * Viewer → CloudFront is unauthenticated by design (OAC only governs the
 * CloudFront → S3 hop; our distribution has TrustedKeyGroups/Signers
 * disabled). Viewer → S3 via presigned URL is time-limited but public.
 * Either way the browser can load it directly.
 *
 * Streaming (non-redirect) responses from the backend are still proxied —
 * used in local dev where the backend serves PDFs directly from MinIO.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const upstream = await fetch(`${BACKEND_URL}/public/documents/${id}/pdf`, {
      method: "GET",
      cache: "no-store",
      redirect: "manual",
    });

    // Forward the backend's redirect to the browser so it can fetch the
    // PDF directly from CloudFront/S3 (edge-cached, zero server-side
    // double-hop through Next.js).
    if (upstream.status === 307 || upstream.status === 302 || upstream.status === 301) {
      const location = upstream.headers.get("Location");
      if (!location) {
        return NextResponse.json(
          { error: "Upstream redirect missing Location header" },
          { status: 502 }
        );
      }
      return NextResponse.redirect(location, upstream.status as 301 | 302 | 307);
    }

    // Non-redirect: backend is streaming bytes directly (local MinIO in dev).
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
