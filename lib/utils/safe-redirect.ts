/**
 * Narrow an attacker-influenced "returnTo" / "returnUrl" string to a
 * same-origin path before passing it to `router.push()` / `router.replace()`.
 *
 * Why:
 * - `router.push("https://evil.com/steal")` will navigate cross-origin;
 *   Next.js does not restrict `push` to same-origin by default.
 * - A `returnTo=//evil.com` ("protocol-relative") value ALSO escapes the
 *   origin — the leading `//` makes the browser treat the rest as a host.
 * - A value like `/%2F%2Fevil.com` is NOT a redirect target and should
 *   be treated as literal path content.
 *
 * Contract:
 * - Returns the input unchanged if it is a well-formed same-origin path
 *   starting with a single `/` (and NOT `//...`).
 * - Returns `fallback` ("/" by default) for anything else — including
 *   absolute URLs, protocol-relative URLs, `javascript:`-style URIs,
 *   empty strings, null, and undefined.
 *
 * This is a client-side helper; it has no access to `window.location`
 * so it is safe to call during SSR. Do NOT extend it to accept
 * `https://lawlens.io/...` — cross-origin navigations should go through
 * a dedicated flow that makes the target visible in the URL bar.
 */
export function safeInternalPath(
  input: string | null | undefined,
  fallback: string = "/",
): string {
  if (typeof input !== "string") return fallback;
  if (input.length === 0 || input.length > 2048) return fallback;
  // Must start with a single "/" — rejects "//evil.com", "http://…",
  // "javascript:…", and bare paths.
  if (input[0] !== "/" || input[1] === "/" || input[1] === "\\") return fallback;
  // Defence-in-depth: reject control characters that some browsers treat
  // as separators. \r\n are the classic CRLF response-splitting payload.
  if (/[\x00-\x1f]/.test(input)) return fallback;
  return input;
}
