/**
 * URL hygiene used by both Sentry configs. The query-string scrubbing
 * is the defense-in-depth layer against the Codex-flagged Sentry
 * breadcrumb leak: the SSE ``stream_token`` JWT rides in URL query
 * strings (EventSource cannot send Authorization headers), so any
 * Sentry breadcrumb capturing the URL would otherwise export the
 * token. These tests pin the scrubbing behavior so a future refactor
 * cannot silently re-introduce the leak.
 */
import { scrubUrl, SENSITIVE_QUERY_PARAMS } from "@/lib/security/scrub-url";

describe("scrubUrl — path identifiers", () => {
  it("replaces UUIDs in path segments with :id", () => {
    expect(
      scrubUrl(
        "https://app.example.com/research/12345678-1234-1234-1234-1234567890ab",
      ),
    ).toBe("https://app.example.com/research/:id");
  });

  it("replaces AKN-style human-readable ids with :hri", () => {
    expect(
      scrubUrl("https://app.example.com/legislation/Income-Tax-Act-1997-11"),
    ).toBe("https://app.example.com/legislation/:hri");
  });

  it("replaces long opaque tokens (>=24 chars) with :token", () => {
    expect(
      scrubUrl(
        "https://app.example.com/api/share/abcDEF123456789_OPQRSTUVWXYZ",
      ),
    ).toBe("https://app.example.com/api/share/:token");
  });

  it("leaves short / unstructured path segments alone", () => {
    expect(scrubUrl("https://app.example.com/chat")).toBe(
      "https://app.example.com/chat",
    );
    expect(scrubUrl("https://app.example.com/research/history")).toBe(
      "https://app.example.com/research/history",
    );
  });
});

describe("scrubUrl — sensitive query params", () => {
  it("redacts stream_token (the SSE JWT shipped with Phase 1)", () => {
    const url =
      "https://app.example.com/api/research/abc/stream?stream_token=eyJhbGciOi.payload.sig";
    expect(scrubUrl(url)).toBe(
      "https://app.example.com/api/research/abc/stream?stream_token=%3Aredacted",
    );
  });

  it("redacts every credential-bearing key in the denylist", () => {
    for (const key of SENSITIVE_QUERY_PARAMS) {
      const result = scrubUrl(
        `https://app.example.com/cb?${key}=secretvalue123`,
      );
      expect(result).toContain(`${key}=%3Aredacted`);
      expect(result).not.toContain("secretvalue123");
    }
  });

  it("is case-insensitive on the param name (Stream_Token also redacted)", () => {
    expect(
      scrubUrl("https://app.example.com/x?Stream_Token=abc123"),
    ).toBe("https://app.example.com/x?Stream_Token=%3Aredacted");
  });

  it("preserves non-sensitive query params unchanged", () => {
    expect(
      scrubUrl("https://app.example.com/search?q=tax&limit=20"),
    ).toBe("https://app.example.com/search?q=tax&limit=20");
  });

  it("redacts only the sensitive key when sensitive + benign coexist", () => {
    const result = scrubUrl(
      "https://app.example.com/cb?code=secret_oauth_code&utm_source=email",
    );
    expect(result).toContain("code=%3Aredacted");
    expect(result).toContain("utm_source=email");
    expect(result).not.toContain("secret_oauth_code");
  });
});

describe("scrubUrl — combined path + query scrubbing", () => {
  it("scrubs both layers in one URL", () => {
    expect(
      scrubUrl(
        "https://app.example.com/research/12345678-1234-1234-1234-1234567890ab/stream?stream_token=jwt.payload.sig&intent=research",
      ),
    ).toBe(
      "https://app.example.com/research/:id/stream?stream_token=%3Aredacted&intent=research",
    );
  });
});

describe("scrubUrl — error handling", () => {
  it("returns the original input on any URL parse failure (never throws)", () => {
    expect(scrubUrl("not a url at all")).toBe("not a url at all");
    expect(scrubUrl("")).toBe("");
  });
});
