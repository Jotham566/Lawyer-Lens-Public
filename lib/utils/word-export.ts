import type { ResearchCitation, ResearchReport } from "@/lib/api/research";
import { ensureRichHtml, sanitizeRichHtml } from "@/lib/utils/rich-text";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildCitationLabel(citation: ResearchCitation): string {
  if (citation.legal_reference) {
    return citation.legal_reference;
  }
  if (citation.case_citation) {
    return citation.court
      ? `${citation.case_citation} (${citation.court})`
      : citation.case_citation;
  }
  if (citation.external_url) {
    return citation.external_url;
  }
  return citation.title;
}

function stripCitationArtifacts(html: string): string {
  return html
    .replace(/\[\s*Sources?\s*:\s*[a-f0-9]{6,8}(?:\s*,\s*[a-f0-9]{6,8})*\s*\]/gi, "")
    .replace(/Citation IDs\s*:\s*[a-f0-9]{6,8}(?:\s*,\s*[a-f0-9]{6,8})*/gi, "")
    .replace(/\[(?:[a-f0-9]{6,8})(?:\s*,\s*[a-f0-9]{6,8})*\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function exportResearchReportToWord(
  report: ResearchReport,
  reportTitle: string,
  executiveSummary: string,
  sectionContent: Record<string, string>,
  executiveSummaryRich?: string | null,
  sectionRichContent?: Record<string, string>,
): void {
  const citationNumbers = new Map(report.citations.map((citation, index) => [citation.id, index + 1]));
  const summaryCitationIds = report.publisher_payload?.executive_summary_citation_ids ?? [];
  const endnotes = report.publisher_payload?.endnotes ?? [];
  const sectionPublisherLookup = new Map(
    (report.publisher_payload?.sections ?? []).map((section) => [section.section_id, section])
  );

  const summaryHtml = sanitizeRichHtml(
    stripCitationArtifacts(
      ensureRichHtml(executiveSummary, executiveSummaryRich ?? report.executive_summary_rich)
    )
  );
  const summaryInlineCitations = summaryCitationIds
    .map((citationId) => {
      const number = citationNumbers.get(citationId);
      return number ? `<sup><a href="#citation-${number}">[${number}]</a></sup>` : "";
    })
    .filter(Boolean)
    .join(" ");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(reportTitle || report.title)}</title>
        <style>
          body { font-family: Georgia, serif; margin: 40px; line-height: 1.6; color: #18181b; }
          h1 { font-size: 26px; margin-bottom: 8px; }
          h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #d4d4d8; padding-bottom: 6px; }
          p { margin: 0 0 12px; }
          .meta { color: #52525b; font-size: 11pt; margin-bottom: 28px; }
          .summary { background: #f5f5f4; padding: 16px; border-left: 4px solid #2563eb; }
          .inline-citations { margin-top: 12px; font-size: 10pt; color: #334155; }
          .inline-citations a, .endnotes a { color: #1d4ed8; text-decoration: none; }
          .endnotes li { margin-bottom: 12px; }
          .quote { color: #52525b; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(reportTitle || report.title)}</h1>
        <div class="meta">
          Generated ${escapeHtml(new Date(report.generated_at).toLocaleString())} • ${report.citations.length} sources
        </div>
        <div class="summary">
          <h2>Executive Summary</h2>
          ${summaryHtml}
          ${summaryInlineCitations ? `<div class="inline-citations">${summaryInlineCitations}</div>` : ""}
        </div>
        ${report.sections.map((section) => {
          const content = sanitizeRichHtml(
            stripCitationArtifacts(
              ensureRichHtml(
                sectionContent[section.id] ?? section.content,
                sectionRichContent?.[section.id] ?? section.rich_content
              )
            )
          );
          const inlineCitations = (sectionPublisherLookup.get(section.id)?.citation_ids || section.citations || [])
            .map((citationId) => {
              const number = citationNumbers.get(citationId);
              return number ? `<sup><a href="#citation-${number}">[${number}]</a></sup>` : "";
            })
            .filter(Boolean)
            .join(" ");

          return `
            <section>
              <h2>${escapeHtml(section.title)}</h2>
              ${content}
              ${inlineCitations ? `<div class="inline-citations">${inlineCitations}</div>` : ""}
            </section>
          `;
        }).join("")}
        <section class="endnotes">
          <h2>Sources and Endnotes</h2>
          ${report.publisher_payload?.methodology_note ? `<p>${escapeHtml(report.publisher_payload.methodology_note)}</p>` : ""}
          <ol>
            ${(endnotes.length
              ? endnotes.map((endnote) => {
                  const citation = report.citations.find((item) => item.id === endnote.citation_id);
                  const preferredUrl = endnote.url || citation?.document_url || citation?.external_url;
                  return `
              <li id="citation-${endnote.number}">
                <strong>${escapeHtml(endnote.title || citation?.title || "Source")}</strong><br />
                ${escapeHtml(endnote.label || (citation ? buildCitationLabel(citation) : ""))}
                ${preferredUrl ? `<br /><a href="${escapeHtml(preferredUrl)}">${escapeHtml(preferredUrl)}</a>` : ""}
                ${endnote.source_quality_label ? `<div>${escapeHtml(endnote.source_quality_label)}</div>` : ""}
                ${endnote.quoted_text ? `<div class="quote">"${escapeHtml(endnote.quoted_text)}"</div>` : ""}
              </li>
            `;
                }).join("")
              : report.citations.map((citation, index) => `
              <li id="citation-${index + 1}">
                <strong>${escapeHtml(citation.title)}</strong><br />
                ${escapeHtml(buildCitationLabel(citation))}
                ${citation.external_url ? `<br /><a href="${escapeHtml(citation.external_url)}">${escapeHtml(citation.external_url)}</a>` : ""}
                ${citation.document_url ? `<br /><a href="${escapeHtml(citation.document_url)}">${escapeHtml(citation.document_url)}</a>` : ""}
                ${citation.quoted_text ? `<div class="quote">"${escapeHtml(citation.quoted_text)}"</div>` : ""}
              </li>
            `).join(""))}
          </ol>
        </section>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(reportTitle || report.title).replace(/[^a-z0-9]+/gi, "_").toLowerCase() || "research-report"}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
