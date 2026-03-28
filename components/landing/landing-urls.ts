/**
 * Landing page URL helper.
 *
 * On localhost / dev: returns relative paths (e.g. "/login")
 * so everything stays on the same dev server.
 *
 * On production root domain (lawlens.io): returns full ug.lawlens.io URLs
 * so users are routed to the product portal.
 */
export function getAppUrl(path: string): string {
  if (typeof window === "undefined") return path;

  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  if (isLocalhost) {
    // Dev: stay on same origin
    return path;
  }

  // Production: route to the UG product domain
  const ugUrl = process.env.NEXT_PUBLIC_UG_URL || "https://ug.lawlens.io";
  return `${ugUrl}${path}`;
}
