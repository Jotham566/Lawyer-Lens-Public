import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with a strict configuration
 */
export function sanitizeHtml(dirty: string): string {
  // Configure DOMPurify for safe HTML rendering
  return DOMPurify.sanitize(dirty, {
    // Only allow specific safe tags
    ALLOWED_TAGS: ["mark", "em", "strong", "b", "i", "span"],
    // Only allow class attribute for styling
    ALLOWED_ATTR: ["class"],
    // Strip unsafe content instead of escaping
    KEEP_CONTENT: true,
    // Don't allow data attributes
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize rich document HTML content (from AKN XML conversion)
 * Uses a more permissive allowlist for document structure while remaining safe
 */
export function sanitizeDocumentHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    // Allow structural and text formatting tags commonly used in legal documents
    ALLOWED_TAGS: [
      // Text formatting
      "p", "span", "em", "strong", "b", "i", "u", "s", "mark", "br",
      // Headings
      "h1", "h2", "h3", "h4", "h5", "h6",
      // Lists
      "ul", "ol", "li", "dl", "dt", "dd",
      // Tables
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
      // Structural
      "div", "section", "article", "header", "footer", "aside", "nav",
      // Quotes and definitions
      "blockquote", "q", "cite", "dfn", "abbr",
      // Code (for legal references)
      "pre", "code",
      // Semantic
      "sub", "sup", "small", "ins", "del", "time",
      // Description list (common in legal)
      "figure", "figcaption",
    ],
    // Safe attributes
    ALLOWED_ATTR: [
      "class", "id", "title", "datetime", "lang",
      // Table attributes
      "colspan", "rowspan", "scope", "headers",
      // Accessibility
      "role", "aria-label", "aria-labelledby", "aria-describedby",
    ],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize search highlight content
 * Converts <em> tags from search API to <mark> tags and sanitizes
 */
export function sanitizeSearchHighlight(content: string): string {
  // First convert <em> to <mark> for consistency
  const withMark = content.replace(/<em>/g, "<mark>").replace(/<\/em>/g, "</mark>");
  // Then sanitize the result
  return sanitizeHtml(withMark);
}

/**
 * Strip all HTML tags from content
 */
export function stripHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}
