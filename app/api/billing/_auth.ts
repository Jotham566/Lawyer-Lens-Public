import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function getAuthHeader(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("Authorization");
  if (header) {
    return header;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (sessionToken) {
    return `Bearer ${sessionToken}`;
  }

  const authToken = cookieStore.get("auth_token")?.value;
  if (authToken) {
    return `Bearer ${authToken}`;
  }

  return null;
}
