import { NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Build the upstream Authorization header for a billing proxy request.
 *
 * Returns the bearer-formatted value to pass to the backend, or null if
 * the request is unauthenticated (caller should respond 401).
 *
 * IMPORTANT — do NOT trust `request.headers.get("Authorization")`.
 *
 * The browser is always free to set any header it likes on a same-origin
 * fetch. A previous version of this helper fell through to accepting the
 * incoming Authorization header whenever it was present. That meant any
 * client could send `Authorization: Bearer <anything>` and the proxy
 * would forward it unmodified to the backend — turning auth into "trust
 * the user-agent", which is exactly what session cookies exist to avoid.
 *
 * The session_token / auth_token cookies are HttpOnly and scoped to the
 * parent domain (*.lawlens.io), so JS on our origin cannot read them and
 * a compromised XSS payload cannot exfiltrate a working Bearer token.
 * That guarantee only holds if we source the token exclusively from
 * cookies — reading it from the Authorization header defeats it.
 *
 * @param _request — unused; kept for signature stability across callers.
 */
export async function getAuthHeader(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest,
): Promise<string | null> {
  const cookieStore = await cookies();
  const accessCookieName = process.env.AUTH_ACCESS_COOKIE || "auth_token";

  const sessionToken = cookieStore.get("session_token")?.value;
  if (sessionToken) {
    return `Bearer ${sessionToken}`;
  }

  const authToken = cookieStore.get(accessCookieName)?.value;
  if (authToken) {
    return `Bearer ${authToken}`;
  }

  return null;
}
