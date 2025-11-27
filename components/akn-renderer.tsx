"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AknRendererProps {
  xmlContent: string;
  className?: string;
  fontSize?: "small" | "medium" | "large";
}

/**
 * Akoma Ntoso XML Renderer
 *
 * Renders AKN XML content with proper styling similar to ulii.org.
 */
export function AknRenderer({
  xmlContent,
  className,
  fontSize = "medium",
}: AknRendererProps) {
  const [parsedContent, setParsedContent] = useState<React.ReactNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!xmlContent) {
      setError("No XML content provided");
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      // Check for parsing errors
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        setError("Failed to parse XML content");
        return;
      }

      // Find the act element
      const act = xmlDoc.querySelector("act");
      if (!act) {
        setError("No act element found in AKN document");
        return;
      }

      // Extract meta information for header
      const meta = extractMeta(xmlDoc);

      // Find the body element
      const body = act.querySelector("body");

      // Find attachments (schedules with tables)
      const attachments = act.querySelector("attachments");

      // Convert XML to React elements
      const content = (
        <div className="akn-act">
          {meta && <ActHeader meta={meta} />}
          {body && <Body element={body} />}
          {attachments && <Attachments element={attachments} />}
        </div>
      );

      setParsedContent(content);
      setError(null);
    } catch (err) {
      setError(`Error parsing XML: ${err}`);
    }
  }, [xmlContent]);

  if (error) {
    return (
      <div className="p-4 text-destructive bg-destructive/10 rounded-lg">
        {error}
      </div>
    );
  }

  if (!parsedContent) {
    return (
      <div className="p-4 text-muted-foreground">Loading document...</div>
    );
  }

  return (
    <div
      className={cn(
        "akn-document leading-relaxed",
        fontSize === "small" && "text-sm",
        fontSize === "medium" && "text-base",
        fontSize === "large" && "text-lg",
        className
      )}
    >
      {parsedContent}
    </div>
  );
}

// ============ Meta Extraction ============

interface ActMeta {
  country?: string;
  title?: string;
  chapter?: string;
  publicationDate?: string;
  publicationName?: string;
  assentDate?: string;
  year?: string;
  actNumber?: string;
  longTitle?: string;
}

function extractMeta(xmlDoc: Document): ActMeta | null {
  const meta: ActMeta = {};

  // Country
  const country = xmlDoc.querySelector("FRBRcountry");
  if (country) {
    const code = country.getAttribute("value");
    meta.country = code === "ug" ? "Uganda" : code?.toUpperCase();
  }

  // Title from FRBRalias
  const alias = xmlDoc.querySelector('FRBRalias[name="title"]');
  if (alias) {
    meta.title = alias.getAttribute("value") || undefined;
  }

  // Publication info
  const publication = xmlDoc.querySelector("publication");
  if (publication) {
    meta.publicationName = publication.getAttribute("name") || undefined;
    meta.publicationDate = publication.getAttribute("date") || undefined;
  }

  // Assent date
  const frbrDate = xmlDoc.querySelector('FRBRWork FRBRdate[name="assent"]');
  if (frbrDate) {
    meta.assentDate = frbrDate.getAttribute("date") || undefined;
    meta.year = meta.assentDate?.split("-")[0];
  }

  // Long title from preface
  const longTitle = xmlDoc.querySelector("longTitle p");
  if (longTitle) {
    meta.longTitle = longTitle.textContent || undefined;
  }

  return Object.keys(meta).length > 0 ? meta : null;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ============ Header Component ============

function ActHeader({ meta }: { meta: ActMeta }) {
  return (
    <header className="text-center mb-8 pb-6 border-b border-border">
      {meta.country && (
        <div className="text-lg font-semibold mb-2">{meta.country}</div>
      )}
      {meta.title && (
        <h1 className="text-2xl font-bold mb-3">{meta.title}</h1>
      )}
      {meta.chapter && (
        <div className="text-lg font-medium mb-4">Chapter {meta.chapter}</div>
      )}
      {meta.publicationName && meta.publicationDate && (
        <div className="text-sm text-muted-foreground underline mb-1">
          Published in {meta.publicationName} on {formatDate(meta.publicationDate)}
        </div>
      )}
      {meta.assentDate && (
        <div className="text-sm mb-3">
          Assented to on {formatDate(meta.assentDate)}
        </div>
      )}
      {meta.longTitle && (
        <p className="text-sm mt-4 max-w-3xl mx-auto leading-relaxed font-medium">
          {meta.longTitle}
        </p>
      )}
      {meta.year && (
        <div className="text-sm text-muted-foreground mt-3 italic">
          [Act {meta.year}]
        </div>
      )}
    </header>
  );
}

// ============ Body Component ============

function Body({ element }: { element: Element }) {
  return (
    <div className="akn-body">
      {Array.from(element.children).map((child, index) => (
        <RenderElement key={index} element={child} />
      ))}
    </div>
  );
}

// ============ Attachments Component ============

function Attachments({ element }: { element: Element }) {
  return (
    <div className="akn-attachments mt-10 pt-8 border-t-2 border-border">
      <h2 className="text-center font-bold text-xl mb-6">Schedules</h2>
      {Array.from(element.children).map((child, index) => (
        <RenderElement key={index} element={child} />
      ))}
    </div>
  );
}

function Attachment({ element }: { element: Element }) {
  // Get attachment heading/title
  const heading = element.querySelector("heading");
  const headingText = heading?.textContent?.trim();

  return (
    <div className="akn-attachment mt-8">
      {headingText && (
        <h3 className="text-center font-bold text-lg mb-4">{headingText}</h3>
      )}
      {Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() !== "meta")
        .map((child, index) => (
          <RenderElement key={index} element={child} />
        ))}
    </div>
  );
}

function MainBody({ element }: { element: Element }) {
  return (
    <div className="akn-mainbody">
      {Array.from(element.children).map((child, index) => (
        <RenderElement key={index} element={child} />
      ))}
    </div>
  );
}

// ============ Main Render Function ============

function RenderElement({ element }: { element: Element }): React.ReactNode {
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case "part":
      return <Part element={element} />;
    case "chapter":
      return <Chapter element={element} />;
    case "section":
      return <Section element={element} />;
    case "subsection":
      return <Subsection element={element} />;
    case "paragraph":
      return <LegalParagraph element={element} />;
    case "subparagraph":
      return <Subparagraph element={element} />;
    case "point":
      return <Point element={element} />;
    case "content":
      return <Content element={element} />;
    case "intro":
      return <Intro element={element} />;
    case "p":
      return <TextParagraph element={element} />;
    case "blocklist":
    case "list":
      return <BlockList element={element} />;
    case "item":
      return <Item element={element} />;
    case "table":
      return <Table element={element} />;
    case "tr":
      return <TableRow element={element} />;
    case "th":
      return <TableHeader element={element} />;
    case "td":
      return <TableCell element={element} />;
    case "hcontainer":
      return <HContainer element={element} />;
    case "wrapup":
      return <WrapUp element={element} />;
    case "attachment":
    case "schedule":
      return <Attachment element={element} />;
    case "mainbody":
      return <MainBody element={element} />;
    case "num":
    case "heading":
    case "meta":
      return null; // Handled by parent or skip
    default:
      return <GenericElement element={element} />;
  }
}

// ============ Helper Functions ============

function getNum(element: Element): string | null {
  const num = element.querySelector(":scope > num");
  return num?.textContent?.trim() || null;
}

function getHeading(element: Element): string | null {
  const heading = element.querySelector(":scope > heading");
  return heading?.textContent?.trim() || null;
}

function getContentChildren(element: Element): Element[] {
  return Array.from(element.children).filter(
    (child) => !["num", "heading"].includes(child.tagName.toLowerCase())
  );
}

function renderInlineContent(element: Element): React.ReactNode {
  const nodes: React.ReactNode[] = [];

  element.childNodes.forEach((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text) nodes.push(text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === "b" || tag === "strong") {
        nodes.push(<strong key={index}>{renderInlineContent(el)}</strong>);
      } else if (tag === "i" || tag === "em") {
        nodes.push(<em key={index}>{renderInlineContent(el)}</em>);
      } else if (tag === "u") {
        nodes.push(<u key={index}>{renderInlineContent(el)}</u>);
      } else if (tag === "ref") {
        nodes.push(
          <span key={index} className="text-primary underline">
            {renderInlineContent(el)}
          </span>
        );
      } else if (tag === "term" || tag === "def") {
        nodes.push(
          <span key={index} className="font-semibold">
            {renderInlineContent(el)}
          </span>
        );
      } else {
        nodes.push(renderInlineContent(el));
      }
    }
  });

  return <>{nodes}</>;
}

// ============ Structural Components ============

function Part({ element }: { element: Element }) {
  const num = getNum(element);
  const heading = getHeading(element);

  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-center font-bold text-lg mb-6">
        {num}
        {num && heading && " – "}
        {heading}
      </h2>
      {getContentChildren(element).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </section>
  );
}

function Chapter({ element }: { element: Element }) {
  const num = getNum(element);
  const heading = getHeading(element);

  return (
    <section className="mt-8">
      <h3 className="text-center font-bold mb-4">
        {num}
        {num && heading && " – "}
        {heading}
      </h3>
      {getContentChildren(element).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </section>
  );
}

function Section({ element }: { element: Element }) {
  const num = getNum(element);
  const heading = getHeading(element);

  return (
    <section className="mt-6">
      <div className="font-bold mb-2">
        {num} {heading}
      </div>
      {getContentChildren(element).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </section>
  );
}

function Subsection({ element }: { element: Element }) {
  const num = getNum(element);

  return (
    <div className="flex mt-3">
      <div className="w-12 flex-shrink-0 text-left">{num}</div>
      <div className="flex-1">
        {getContentChildren(element).map((child, i) => (
          <RenderElement key={i} element={child} />
        ))}
      </div>
    </div>
  );
}

function LegalParagraph({ element }: { element: Element }) {
  const num = getNum(element);

  return (
    <div className="flex mt-2 ml-12">
      <div className="w-10 flex-shrink-0 text-left">{num}</div>
      <div className="flex-1">
        {getContentChildren(element).map((child, i) => (
          <RenderElement key={i} element={child} />
        ))}
      </div>
    </div>
  );
}

function Subparagraph({ element }: { element: Element }) {
  const num = getNum(element);

  return (
    <div className="flex mt-1 ml-10">
      <div className="w-10 flex-shrink-0 text-left">{num}</div>
      <div className="flex-1">
        {getContentChildren(element).map((child, i) => (
          <RenderElement key={i} element={child} />
        ))}
      </div>
    </div>
  );
}

function Point({ element }: { element: Element }) {
  const num = getNum(element);

  return (
    <div className="flex mt-1 ml-10">
      <div className="w-10 flex-shrink-0 text-left">{num}</div>
      <div className="flex-1">
        {getContentChildren(element).map((child, i) => (
          <RenderElement key={i} element={child} />
        ))}
      </div>
    </div>
  );
}

function HContainer({ element }: { element: Element }) {
  const num = getNum(element);
  const heading = getHeading(element);

  return (
    <div className="mt-4">
      {(num || heading) && (
        <div className="font-medium mb-2">
          {num} {heading}
        </div>
      )}
      {getContentChildren(element).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </div>
  );
}

// ============ Content Components ============

function Content({ element }: { element: Element }) {
  return (
    <>
      {Array.from(element.children).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </>
  );
}

function Intro({ element }: { element: Element }) {
  return (
    <div className="mb-1">
      {Array.from(element.children).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </div>
  );
}

function TextParagraph({ element }: { element: Element }) {
  return <p className="my-1">{renderInlineContent(element)}</p>;
}

function BlockList({ element }: { element: Element }) {
  return (
    <div className="mt-2">
      {Array.from(element.children).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </div>
  );
}

function Item({ element }: { element: Element }) {
  const num = getNum(element);

  return (
    <div className="flex mt-1">
      <div className="w-10 flex-shrink-0 text-left">{num}</div>
      <div className="flex-1">
        {getContentChildren(element).map((child, i) => (
          <RenderElement key={i} element={child} />
        ))}
      </div>
    </div>
  );
}

function WrapUp({ element }: { element: Element }) {
  return (
    <div className="mt-2">
      {Array.from(element.children).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </div>
  );
}

// ============ Table Components ============

function Table({ element }: { element: Element }) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse border border-border text-sm">
        <tbody>
          {Array.from(element.children).map((child, i) => (
            <RenderElement key={i} element={child} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableRow({ element }: { element: Element }) {
  return (
    <tr className="border-b border-border">
      {Array.from(element.children).map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </tr>
  );
}

function TableHeader({ element }: { element: Element }) {
  return (
    <th className="p-3 text-left font-semibold bg-muted border border-border">
      {renderInlineContent(element)}
    </th>
  );
}

function TableCell({ element }: { element: Element }) {
  return (
    <td className="p-3 border border-border align-top">
      {renderInlineContent(element)}
    </td>
  );
}

// ============ Generic Fallback ============

function GenericElement({ element }: { element: Element }) {
  const children = Array.from(element.children);

  if (children.length === 0) {
    const text = element.textContent?.trim();
    return text ? <span>{text}</span> : null;
  }

  return (
    <>
      {children.map((child, i) => (
        <RenderElement key={i} element={child} />
      ))}
    </>
  );
}

export default AknRenderer;
