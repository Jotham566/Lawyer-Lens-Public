/**
 * Conversation Export Utilities
 *
 * Functions for exporting conversations to various formats.
 */

import type { Conversation } from "@/lib/stores/chat-store";

/**
 * Export a conversation to Markdown format
 */
export function exportToMarkdown(conversation: Conversation): string {
  const title = conversation.title || "Untitled Conversation";
  const exportDate = new Date().toLocaleString();
  const createdDate = new Date(conversation.createdAt).toLocaleString();

  let md = `# ${title}\n\n`;
  md += `**Created:** ${createdDate}  \n`;
  md += `**Exported:** ${exportDate}\n\n`;
  md += `---\n\n`;

  for (const msg of conversation.messages) {
    const role = msg.role === "user" ? "## You" : "## Law Lens Assistant";
    const timestamp = msg.timestamp
      ? new Date(msg.timestamp).toLocaleString()
      : "";

    md += `${role}\n`;
    if (timestamp) {
      md += `*${timestamp}*\n\n`;
    }
    md += `${msg.content}\n\n`;

    // Include sources/citations if present
    if (msg.sources && msg.sources.length > 0) {
      md += `**Sources:**\n`;
      for (const source of msg.sources) {
        md += `- ${source.title}`;
        if (source.human_readable_id) {
          md += ` (${source.human_readable_id})`;
        }
        md += `\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  md += `\n*Exported from Law Lens - https://lawlens.io*\n`;

  return md;
}

/**
 * Export a conversation to plain text format
 */
export function exportToText(conversation: Conversation): string {
  const title = conversation.title || "Untitled Conversation";
  const exportDate = new Date().toLocaleString();

  let text = `${title}\n`;
  text += `${"=".repeat(title.length)}\n\n`;
  text += `Exported: ${exportDate}\n\n`;
  text += `${"-".repeat(50)}\n\n`;

  for (const msg of conversation.messages) {
    const role = msg.role === "user" ? "You:" : "Law Lens:";
    text += `${role}\n\n`;
    text += `${msg.content}\n\n`;

    if (msg.sources && msg.sources.length > 0) {
      text += `Sources: ${msg.sources.map((s) => s.title).join(", ")}\n\n`;
    }

    text += `${"-".repeat(50)}\n\n`;
  }

  return text;
}

/**
 * Generate HTML content for PDF export (used with print)
 */
export function generatePrintHtml(conversation: Conversation): string {
  const title = conversation.title || "Untitled Conversation";
  const exportDate = new Date().toLocaleString();
  const createdDate = new Date(conversation.createdAt).toLocaleString();

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - Law Lens Export</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a1a;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .metadata {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .message {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }
    .message:last-child {
      border-bottom: none;
    }
    .role {
      font-weight: 600;
      font-size: 14px;
      color: #475569;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .role.user {
      color: #2563eb;
    }
    .role.assistant {
      color: #059669;
    }
    .content {
      white-space: pre-wrap;
    }
    .sources {
      margin-top: 12px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 13px;
    }
    .sources-title {
      font-weight: 600;
      color: #475569;
      margin-bottom: 4px;
    }
    .source-item {
      color: #64748b;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .message {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="metadata">
    Created: ${createdDate} | Exported: ${exportDate}
  </div>
`;

  for (const msg of conversation.messages) {
    const roleClass = msg.role === "user" ? "user" : "assistant";
    const roleLabel = msg.role === "user" ? "You" : "Law Lens Assistant";

    html += `
  <div class="message">
    <div class="role ${roleClass}">${roleLabel}</div>
    <div class="content">${escapeHtml(msg.content)}</div>
`;

    if (msg.sources && msg.sources.length > 0) {
      html += `
    <div class="sources">
      <div class="sources-title">Sources</div>
`;
      for (const source of msg.sources) {
        html += `      <div class="source-item">• ${escapeHtml(source.title)}`;
        if (source.human_readable_id) {
          html += ` (${escapeHtml(source.human_readable_id)})`;
        }
        html += `</div>\n`;
      }
      html += `    </div>\n`;
    }

    html += `  </div>\n`;
  }

  html += `
  <div class="footer">
    Exported from Law Lens - lawlens.io
  </div>
</body>
</html>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Download content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a safe filename from conversation title
 */
export function generateFilename(
  title: string | undefined,
  extension: string
): string {
  const baseTitle = title || "conversation";
  // Remove special characters and limit length
  const safeName = baseTitle
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 50);
  const timestamp = new Date().toISOString().split("T")[0];
  return `${safeName}-${timestamp}.${extension}`;
}

/**
 * Open print dialog for PDF export
 */
export function printConversation(conversation: Conversation): void {
  const html = generatePrintHtml(conversation);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
