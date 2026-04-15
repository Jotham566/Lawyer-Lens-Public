import { safeInternalPath } from "@/lib/utils/safe-redirect";

describe("safeInternalPath", () => {
  describe("accepts well-formed same-origin paths", () => {
    it.each([
      ["/"],
      ["/chat"],
      ["/document/abc-123"],
      ["/search?q=foo&page=2"],
      ["/foo#section-1"],
      ["/api/documents/abc"],
      ["/path/with%20encoded"],
    ])("returns %s unchanged", (input) => {
      expect(safeInternalPath(input, "/")).toBe(input);
    });
  });

  describe("rejects absolute / cross-origin URLs", () => {
    it.each([
      ["https://evil.com/steal"],
      ["http://evil.com"],
      ["https://lawlens.io.evil.com/"],
      ["HTTPS://EVIL.COM/"],
    ])("%s → fallback", (input) => {
      expect(safeInternalPath(input, "/")).toBe("/");
    });
  });

  describe("rejects protocol-relative and path-smuggle attempts", () => {
    it.each([
      ["//evil.com/phish"],
      ["///evil.com"],
      ["/\\evil.com"],
      ["\\evil.com"],
    ])("%s → fallback", (input) => {
      expect(safeInternalPath(input, "/fallback")).toBe("/fallback");
    });
  });

  describe("rejects non-http(s) schemes", () => {
    it.each([
      ["javascript:alert(1)"],
      ["data:text/html,foo"],
      ["ftp://example.com/"],
      ["mailto:a@b.c"],
    ])("%s → fallback", (input) => {
      expect(safeInternalPath(input, "/")).toBe("/");
    });
  });

  describe("rejects control characters (CRLF injection)", () => {
    it("newline", () => {
      expect(safeInternalPath("/ok\r\nSet-Cookie: evil=1")).toBe("/");
    });
    it("null byte", () => {
      expect(safeInternalPath("/ok\x00junk")).toBe("/");
    });
  });

  describe("rejects empty / null / non-string / oversized input", () => {
    it("null", () => {
      expect(safeInternalPath(null, "/")).toBe("/");
    });
    it("undefined", () => {
      expect(safeInternalPath(undefined, "/")).toBe("/");
    });
    it("empty string", () => {
      expect(safeInternalPath("", "/")).toBe("/");
    });
    it("bare path without leading slash", () => {
      expect(safeInternalPath("chat", "/")).toBe("/");
    });
    it("oversized (>2048 chars)", () => {
      expect(safeInternalPath("/" + "a".repeat(5000), "/")).toBe("/");
    });
  });

  it("respects the explicit fallback", () => {
    expect(safeInternalPath("https://evil.com", "/chat")).toBe("/chat");
  });
});
