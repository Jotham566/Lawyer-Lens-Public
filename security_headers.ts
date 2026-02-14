import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const deployEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
  if (deployEnv === "production" && process.env.NODE_ENV !== "production") {
    throw new Error("NODE_ENV must be 'production' when NEXT_PUBLIC_ENVIRONMENT=production");
  }

  const isProd = process.env.NODE_ENV === "production";
  const nonce = generateNonce();

  const apiOrigins = getApiOrigins();
  const umamiOrigin = getUmamiOrigin();
  const connectSrc = [
    "'self'",
    "http://localhost:*",
    ...apiOrigins,
    ...(umamiOrigin ? [umamiOrigin] : []),
  ].join(" ");

  const strictStyles = process.env.CSP_STRICT_STYLES === "true";
  const styleSrc = strictStyles
    ? `style-src 'self' 'nonce-${nonce}'`
    : "style-src 'self' 'unsafe-inline'";
  const styleSrcElem = strictStyles
    ? `style-src-elem 'self' 'nonce-${nonce}'`
    : "style-src-elem 'self' 'unsafe-inline'";

  const devInline = isProd ? "" : " 'unsafe-inline'";
  const scriptNonce = isProd ? ` 'nonce-${nonce}'` : "";

  // Hashes for Next.js internal inline scripts (hydration bootstrap)
  // These are stable per build and required because Next.js generates inline scripts
  // that we can't add nonce to directly
  const nextjsScriptHashes = isProd
    ? " 'sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk=' 'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo=' 'sha256-rpFLA0A0bZa5TNfjM1XqirwKzdeQw7T9ftN+4hUm3Gc='"
    : "";

  // Allow unsafe-inline for Umami analytics scripts (they generate dynamic inline scripts)
  // This is acceptable for analytics and required for Umami to function
  const umamiInline = umamiOrigin ? " 'unsafe-inline'" : "";

  const scriptOrigins = umamiOrigin ? ` ${umamiOrigin}` : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self'${scriptNonce}${nextjsScriptHashes}${scriptOrigins}${umamiInline}${isProd ? "" : " 'unsafe-eval'"}${devInline}`,
    `script-src-elem 'self'${scriptNonce}${nextjsScriptHashes}${scriptOrigins}${umamiInline}${isProd ? "" : " 'unsafe-eval'"}${devInline}`,
    styleSrc,
    styleSrcElem,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isProd ? ["upgrade-insecure-requests", "block-all-mixed-content"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}



function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function getApiOrigins(): string[] {
  const origins = new Set<string>();
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.INTERNAL_API_URL,
    process.env.BACKEND_URL,
    process.env.ADMIN_API_URL,
  ].filter(Boolean) as string[];

  for (const value of candidates) {
    try {
      const url = new URL(value);
      origins.add(url.origin);
    } catch {
      // ignore invalid URL
    }
  }

  return Array.from(origins);
}

function getUmamiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_UMAMI_HOST;
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return null;
  }
}
