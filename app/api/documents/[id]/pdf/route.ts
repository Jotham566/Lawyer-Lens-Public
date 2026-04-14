import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_API_URL || "http://localhost:8003/api/v1";

/**
 * In production we want to FORWARD the backend's 307 to the browser so the
 * browser fetches the PDF directly from CloudFront — that hits the edge cache
 * and avoids the Uganda ↔ us-east-1 ↔ S3 ↔ us-east-1 ↔ Uganda double-hop.
 *
 * In local dev the backend may redirect to a URL that the *browser* cannot
 * reach: e.g. `http://minio:9000/...` (Docker-internal hostname) or a
 * presigned S3 URL pointing at a bucket the dev machine has no AWS creds
 * for. Forwarding the 307 in those cases produces "Failed to fetch" in
 * pdf.js. Set `LOCAL_PDF_PROXY=true` in `.env.local` to opt back into the
 * old body-proxy behavior — the route follows the redirect server-side and
 * streams the bytes back as a same-origin response.
 *
 * Default (unset / not "true"): forward the redirect (production path).
 */
const LOCAL_PROXY_REDIRECTS = process.env.LOCAL_PDF_PROXY === "true";

/**
 * Public PDF download route.
 *
 * Backend returns either:
 *   - 307 → CloudFront URL (prod) or presigned S3 URL (S3-configured envs)
 *   - 200 streaming → PDF bytes directly (local MinIO in dev, no S3 bucket)
 *
 * Viewer → CloudFront is unauthenticated by design (OAC only governs the
 * CloudFront → S3 hop; our distribution has TrustedKeyGroups/Signers
 * disabled). Viewer → S3 via presigned URL is time-limited but public.
 * Either way the browser can load it directly *in production*.
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

    if (upstream.status === 307 || upstream.status === 302 || upstream.status === 301) {
      const location = upstream.headers.get("Location");
      if (!location) {
        return NextResponse.json(
          { error: "Upstream redirect missing Location header" },
          { status: 502 }
        );
      }

      // Local-dev escape hatch: follow the redirect server-side and stream
      // the body back, so the browser only ever sees this same-origin route.
      // Necessary when LOCATION points at MinIO Docker-internal hostnames
      // or any URL the dev browser can't reach directly.
      if (LOCAL_PROXY_REDIRECTS) {
        const pdfResponse = await fetch(location, {
          method: "GET",
          cache: "no-store",
        });
        if (!pdfResponse.ok || !pdfResponse.body) {
          return NextResponse.json(
            { error: `Redirect target returned ${pdfResponse.status}` },
            { status: pdfResponse.status || 502 }
          );
        }
        const headers = new Headers();
        headers.set(
          "Content-Type",
          pdfResponse.headers.get("Content-Type") || "application/pdf"
        );
        headers.set(
          "Content-Disposition",
          pdfResponse.headers.get("Content-Disposition") ||
            'inline; filename="document.pdf"'
        );
        const contentLength = pdfResponse.headers.get("Content-Length");
        if (contentLength) headers.set("Content-Length", contentLength);
        return new NextResponse(pdfResponse.body, { status: 200, headers });
      }

      // Production path: forward the redirect; browser hits CloudFront/S3
      // directly (edge-cached on subsequent hits).
      return NextResponse.redirect(location, upstream.status as 301 | 302 | 307);
    }

    // Non-redirect: backend is streaming bytes directly (local MinIO in dev
    // when no S3 bucket is configured). Pass through unchanged.
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
