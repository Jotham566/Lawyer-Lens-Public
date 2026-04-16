import { NextRequest, NextResponse } from "next/server";
import { proxy as applySecurityHeaders } from "./security_headers";

/* ─────────────────────────────────────────────────────────
   Domain constants
   ───────────────────────────────────────────────────────── */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "lawlens.io";
const WWW_DOMAIN = `www.${ROOT_DOMAIN}`;

/** Landing routes that exist in app/landing/ */
const LANDING_ROUTES = ["/"];

/** Routes served identically on both domains (privacy, terms) */
const SHARED_ROUTES = ["/privacy", "/terms"];

/* ─────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────── */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const expectedOrigin = request.nextUrl.origin;

  try {
    if (origin) {
      return new URL(origin).origin === expectedOrigin;
    }
    if (referer) {
      return new URL(referer).origin === expectedOrigin;
    }
  } catch {
    return false;
  }

  return false;
}

function isRootDomain(host: string): boolean {
  return host === ROOT_DOMAIN || host === WWW_DOMAIN;
}

/* ─────────────────────────────────────────────────────────
   Proxy entrypoint
   ───────────────────────────────────────────────────────── */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] || "";
  const { pathname } = request.nextUrl;

  // ── www.lawlens.io → canonical redirect ──
  if (host === WWW_DOMAIN) {
    const url = request.nextUrl.clone();
    url.host = ROOT_DOMAIN;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // ── Root domain (lawlens.io) → landing pages ──
  if (isRootDomain(host)) {
    // Shared routes: serve same content, just tag the domain context
    if (SHARED_ROUTES.some((r) => pathname === r)) {
      const response = applySecurityHeaders(request);
      response.headers.set("x-ll-domain", "landing");
      return response;
    }

    // Landing routes → rewrite to /landing/... route group
    if (LANDING_ROUTES.some((r) => pathname === r)) {
      const url = request.nextUrl.clone();
      url.pathname = `/landing${pathname === "/" ? "" : pathname}`;

      // Clone request headers and add domain marker
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-ll-domain", "landing");

      const response = NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
      response.headers.set("x-ll-domain", "landing");
      return response;
    }

    // Direct /landing/* URLs (and already-rewritten internal paths) also
    // need the landing marker so app/layout.tsx skips AppShell on the
    // server render. Without this, soft-navigation away from landing
    // can leave the internal rewritten path in x-next-url and cause the
    // layout's fallback path check to wrongly treat /chat as landing
    // (which dropped DashboardShell until a hard refresh).
    if (pathname.startsWith("/landing")) {
      const response = applySecurityHeaders(request);
      response.headers.set("x-ll-domain", "landing");
      return response;
    }

    // Unknown paths on root domain — no redirect needed since
    // app and landing are on the same domain (lawlens.io)
    return NextResponse.next();
  }

  // ── Product domain (ug.lawlens.io, localhost) ──

  // CSRF protection for billing endpoints
  const method = request.method.toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isMutating && pathname.startsWith("/api/billing")) {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
    }
  }

  return applySecurityHeaders(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icons/|fonts/|images/).*)"],
};
