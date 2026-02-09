import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function getAuthHeader(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("Authorization");
  if (header) {
    return header;
  }

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
