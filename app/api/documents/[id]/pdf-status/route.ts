import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8003/api/v1";

/**
 * Lightweight pre-flight check for PDF availability.
 *
 * The detail page calls this before mounting `<PdfReader>`. If the upstream
 * PDF route would 404 (orphan PDF case from the 2026-05-04 incident), we
 * return `{ available: false, message }` and the page renders a friendly
 * banner instead of a broken viewer.
 *
 * We use a HEAD against the upstream PDF endpoint when supported. The public
 * PDF route returns either a 307 (redirect to CloudFront/S3 — file exists)
 * or a non-2xx (file unreachable). We follow neither — this is a status
 * check, not a fetch.
 *
 * Always returns 200 with a JSON body so caller code stays simple.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    // Use HEAD if the backend supports it (FastAPI auto-handles HEAD for
    // GET routes). Fall back to GET with manual redirect handling if HEAD
    // returns 405.
    let upstream = await fetch(`${BACKEND_URL}/public/documents/${id}/pdf`, {
      method: "HEAD",
      cache: "no-store",
      redirect: "manual",
    });

    if (upstream.status === 405) {
      upstream = await fetch(`${BACKEND_URL}/public/documents/${id}/pdf`, {
        method: "GET",
        cache: "no-store",
        redirect: "manual",
      });
    }

    // 2xx OR 3xx (redirect to CloudFront/S3) both mean "file is reachable".
    if (upstream.status >= 200 && upstream.status < 400) {
      return NextResponse.json({ available: true }, { status: 200 });
    }

    // 404 specifically = doc exists but PDF is unreachable. Other failures
    // (5xx, 502 from BFF, etc.) are infra issues — treat as unavailable
    // for the user-facing banner but distinguish in the message so logs /
    // support can pick up the difference.
    const isOrphan = upstream.status === 404;
    return NextResponse.json(
      {
        available: false,
        reason: isOrphan ? "orphan" : "upstream_error",
        upstream_status: upstream.status,
        message: isOrphan
          ? "The PDF for this document is temporarily unavailable. We've been notified and are restoring it."
          : "The PDF service is having trouble right now. Please try again in a few minutes.",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("PDF status check failed:", err);
    return NextResponse.json(
      {
        available: false,
        reason: "network_error",
        message: "Could not verify PDF availability. Please try again.",
      },
      { status: 200 },
    );
  }
}
