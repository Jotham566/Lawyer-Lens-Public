import { buildHierarchyPath, parseCitationExcerpt } from "../citation-excerpt-utils";
import type { ChatSource } from "@/lib/api/types";

describe("citation excerpt utils", () => {
  it("extracts heading and table rows from table-columns format", () => {
    const excerpt = `[Schedule 2: Excise duty]\nTable columns: Item, Excise Duty/Rate of excise duty\nItem: 1. Cigarettes; Excise Duty/Rate of excise duty: Ushs. 55,000 per 1000 sticks`;
    const parsed = parseCitationExcerpt(excerpt);

    expect(parsed.hierarchyLabel).toBe("Schedule 2: Excise duty");
    expect(parsed.tables).toHaveLength(1);
    expect(parsed.tables[0].headers).toEqual(["Item", "Excise Duty/Rate of excise duty"]);
    expect(parsed.tables[0].rows[0]).toEqual([
      "1. Cigarettes",
      "Ushs. 55,000 per 1000 sticks",
    ]);
  });

  it("parses html table excerpts into structured rows", () => {
    const excerpt =
      '[Schedule 2: Excise duty]<table><tr><th>Item</th><th>Rate</th></tr><tr><td>Opaque beer</td><td>20% or Ushs. 230 per litre</td></tr></table>';
    const parsed = parseCitationExcerpt(excerpt);

    expect(parsed.hierarchyLabel).toBe("Schedule 2: Excise duty");
    expect(parsed.tables).toHaveLength(1);
    expect(parsed.tables[0].headers).toEqual(["Item", "Rate"]);
    expect(parsed.tables[0].rows).toEqual([["Opaque beer", "20% or Ushs. 230 per litre"]]);
    expect(parsed.bodyText).toBe("");
  });

  it("parses loose html row fragments without table wrapper", () => {
    const excerpt =
      '[Schedule 2: Excise duty]<tr><th>Item</th><th>Rate</th></tr><tr><td>Opaque beer</td><td>20% or Ushs. 230 per litre</td></tr>';
    const parsed = parseCitationExcerpt(excerpt);

    expect(parsed.tables).toHaveLength(1);
    expect(parsed.tables[0].headers).toEqual(["Item", "Rate"]);
    expect(parsed.tables[0].rows[0]).toEqual(["Opaque beer", "20% or Ushs. 230 per litre"]);
  });

  it("builds readable hierarchy breadcrumb from hierarchy_path", () => {
    const source = {
      document_id: "doc-1",
      title: "Test",
      human_readable_id: "ACT-1",
      document_type: "act",
      excerpt: "text",
      relevance_score: 0.9,
      hierarchy_path: [
        { type: "part", identifier: "IV", title: "Control of excisable goods" },
        { type: "section", identifier: "8", title: "Deficiency or excess in stock" },
        { type: "subsection", identifier: "2", title: "" },
      ],
    } satisfies ChatSource;

    expect(buildHierarchyPath(source)).toEqual([
      "Part IV: Control of excisable goods",
      "Section 8: Deficiency or excess in stock",
      "Subsection 2",
    ]);
  });
});
