"use client";

import DOMPurify from "dompurify";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInlineMarkdown(value: string): string {
  let html = escapeHtml(value);

  // Autolinks: <https://example.com>
  html = html.replace(
    /&lt;(https?:\/\/[^&]+)&gt;/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Markdown links: [label](https://example.com)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Bare URLs
  html = html.replace(
    /(^|[\s(>])((https?:\/\/|www\.)[^\s<]+)/g,
    (_match, prefix: string, url: string) => {
      const normalizedUrl = url.startsWith("www.") ? `https://${url}` : url;
      return `${prefix}<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    }
  );

  // Bold, italic, code
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\\s(])\*([^*]+)\*(?=$|[\\s).,;:])/g, "$1<em>$2</em>");
  html = html.replace(/`([^`]+)`/g, "<span>$1</span>");

  return html;
}

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "blockquote",
      "h1", "h2", "h3", "h4", "span", "sup", "sub", "a", "div", "section", "header",
      "details", "summary",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "class",
      "id",
      "data-inline-citations",
      "data-section-id",
      "data-section-anchor",
      "data-report-part",
      "data-contract-part",
      "data-report-body",
      "data-contract-body",
      "contenteditable",
      "colspan",
      "rowspan",
    ],
  });
}

export function plainTextToRichHtml(content: string): string {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const htmlParts: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let tableRows: string[][] = [];

  const nextNonEmptyLine = (startIndex: number): string | null => {
    for (let index = startIndex; index < lines.length; index += 1) {
      const candidate = lines[index].trim();
      if (candidate) return candidate;
    }
    return null;
  };

  const closeList = () => {
    if (listType) {
      htmlParts.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeTable = () => {
    if (tableRows.length === 0) return;
    const [headerRow, ...bodyRows] = tableRows;
    htmlParts.push(`
      <table>
        <thead>
          <tr>${headerRow.map((cell) => `<th>${formatInlineMarkdown(cell)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${bodyRows
            .map((row) => `<tr>${row.map((cell) => `<td>${formatInlineMarkdown(cell)}</td>`).join("")}</tr>`)
            .join("")}
        </tbody>
      </table>
    `);
    tableRows = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trim();
    if (!line) {
      const upcoming = nextNonEmptyLine(lineIndex + 1);
      const continuesOrderedList = listType === "ol" && upcoming !== null && /^\d+\.\s/.test(upcoming);
      const continuesBulletList = listType === "ul" && upcoming !== null && upcoming.startsWith("- ");
      if (!continuesOrderedList && !continuesBulletList) {
        closeList();
      }
      closeTable();
      continue;
    }

    if (line.includes("|") && /^\|?.+\|.+\|?$/.test(line)) {
      closeList();
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());
      const isDividerRow = cells.every((cell) => /^:?-{3,}:?$/.test(cell));
      if (!isDividerRow) {
        tableRows.push(cells);
      }
      continue;
    }

    closeTable();

    if (line.startsWith("#### ")) {
      closeList();
      htmlParts.push(`<h4>${formatInlineMarkdown(line.slice(5))}</h4>`);
      continue;
    }
    if (line.startsWith("### ")) {
      closeList();
      htmlParts.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeList();
      htmlParts.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      htmlParts.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("> ")) {
      closeList();
      htmlParts.push(`<blockquote>${formatInlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (listType !== "ul") {
        closeList();
        listType = "ul";
        htmlParts.push("<ul>");
      }
      htmlParts.push(`<li>${formatInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (listType !== "ol") {
        closeList();
        listType = "ol";
        htmlParts.push("<ol>");
      }
      htmlParts.push(`<li>${formatInlineMarkdown(line.replace(/^\d+\.\s/, ""))}</li>`);
      continue;
    }

    closeList();
    htmlParts.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  closeList();
  closeTable();
  return sanitizeRichHtml(htmlParts.join("") || "<p></p>");
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function looksLikeMarkdownDocument(value: string): boolean {
  return /(^|\n)\s{0,3}(#{1,6}\s|>\s|- |\d+\.\s|\|.+\|)/m.test(value);
}

export function stripEditorArtifacts(html: string): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("[data-inline-citations]").forEach((node) => node.remove());
  return doc.body.innerHTML;
}

export function richHtmlToPlainText(html: string): string {
  if (typeof window === "undefined") return html;
  const cleaned = stripEditorArtifacts(html);
  const doc = new DOMParser().parseFromString(cleaned, "text/html");
  const blocks = Array.from(doc.body.childNodes);
  const text = blocks
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() || "";
      }
      const element = node as HTMLElement;
      if (element.tagName === "LI") {
        return `- ${element.textContent?.trim() || ""}`;
      }
      return element.textContent?.trim() || "";
    })
    .filter(Boolean)
    .join("\n\n");

  return text.trim();
}

export function ensureRichHtml(content: string, richContent?: string | null): string {
  if (richContent && richContent.trim()) {
    if (!looksLikeHtml(richContent) && looksLikeMarkdownDocument(richContent)) {
      return plainTextToRichHtml(richContent);
    }
    return sanitizeRichHtml(richContent);
  }
  return plainTextToRichHtml(content || "");
}
