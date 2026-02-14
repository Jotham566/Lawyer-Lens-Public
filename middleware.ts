import { NextRequest, NextResponse } from "next/server";
import { proxy as applySecurityHeaders } from "./proxy";

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

export function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();
  const isMutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (isMutating && request.nextUrl.pathname.startsWith("/api/billing")) {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF blocked" }, { status: 403 });
    }
  }

  return applySecurityHeaders(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
