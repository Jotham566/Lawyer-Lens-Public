/**
 * Tests for HTML sanitization utilities
 */

import {
  sanitizeHtml,
  sanitizeDocumentHtml,
  sanitizeSearchHighlight,
} from "@/lib/utils/sanitize";

describe("sanitizeHtml", () => {
  it("should allow safe tags", () => {
    const input = "<mark>highlighted</mark> <em>emphasized</em> <strong>bold</strong>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<mark>");
    expect(result).toContain("<em>");
    expect(result).toContain("<strong>");
  });

  it("should remove script tags", () => {
    const input = '<script>alert("xss")</script>Safe text';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
    expect(result).toContain("Safe text");
  });

  it("should remove event handlers", () => {
    const input = '<span onclick="alert(1)">Click me</span>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onclick");
    expect(result).toContain("Click me");
  });

  it("should remove dangerous attributes", () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("should preserve class attributes on allowed tags", () => {
    const input = '<span class="highlight">Text</span>';
    const result = sanitizeHtml(input);
    expect(result).toContain('class="highlight"');
  });

  it("should handle empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("should handle plain text", () => {
    const input = "Just plain text with no HTML";
    expect(sanitizeHtml(input)).toBe(input);
  });
});

describe("sanitizeDocumentHtml", () => {
  it("should allow structural HTML elements", () => {
    const input = "<h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul>";
    const result = sanitizeDocumentHtml(input);
    expect(result).toContain("<h1>");
    expect(result).toContain("<p>");
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>");
  });

  it("should allow table elements", () => {
    const input = "<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>";
    const result = sanitizeDocumentHtml(input);
    expect(result).toContain("<table>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("<tr>");
    expect(result).toContain("<th>");
    expect(result).toContain("<td>");
  });

  it("should allow ARIA attributes", () => {
    const input = '<div role="region" aria-label="Legal section">Content</div>';
    const result = sanitizeDocumentHtml(input);
    expect(result).toContain('role="region"');
    expect(result).toContain('aria-label="Legal section"');
  });

  it("should remove script tags", () => {
    const input = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitizeDocumentHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Safe</p>");
  });

  it("should preserve id attributes", () => {
    const input = '<section id="section-1">Content</section>';
    const result = sanitizeDocumentHtml(input);
    expect(result).toContain('id="section-1"');
  });
});

describe("sanitizeSearchHighlight", () => {
  it("should convert em tags to mark tags", () => {
    const input = "This is <em>highlighted</em> text";
    const result = sanitizeSearchHighlight(input);
    expect(result).toContain("<mark>highlighted</mark>");
    expect(result).not.toContain("<em>");
  });

  it("should handle multiple highlights", () => {
    const input = "<em>First</em> and <em>second</em> highlights";
    const result = sanitizeSearchHighlight(input);
    expect(result).toContain("<mark>First</mark>");
    expect(result).toContain("<mark>second</mark>");
  });

  it("should sanitize the result", () => {
    const input = '<em>Highlight</em><script>alert(1)</script>';
    const result = sanitizeSearchHighlight(input);
    expect(result).toContain("<mark>Highlight</mark>");
    expect(result).not.toContain("<script>");
  });

  it("should handle input without em tags", () => {
    const input = "No highlights here";
    const result = sanitizeSearchHighlight(input);
    expect(result).toBe("No highlights here");
  });

  it("should handle nested content within em tags", () => {
    const input = "<em>highlighted <strong>bold</strong> text</em>";
    const result = sanitizeSearchHighlight(input);
    expect(result).toContain("<mark>");
    expect(result).toContain("</mark>");
    expect(result).toContain("<strong>bold</strong>");
  });
});
