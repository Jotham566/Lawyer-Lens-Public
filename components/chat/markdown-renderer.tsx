"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import {
  SourceCitation,
  parseSourceCitations,
} from "@/components/citations";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ChatSource } from "@/lib/api/types";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** Sources for citation linking (indexed by number [1], [2], etc.) */
  sources?: ChatSource[];
  /** Enable citation preview on hover */
  enableCitationPreviews?: boolean;
}

/**
 * Process text to find and render source citations like [1], [2, 3]
 */
function renderTextWithCitations(
  text: string,
  sources: ChatSource[],
  enablePreviews: boolean
): React.ReactNode {
  if (!enablePreviews || sources.length === 0) {
    return text;
  }

  const segments = parseSourceCitations(text);

  // If no citations found, return plain text
  if (segments.length === 1 && segments[0].type === "text") {
    return text;
  }

  return segments.map((segment, idx) => {
    if (segment.type === "text") {
      return <React.Fragment key={idx}>{segment.content}</React.Fragment>;
    }

    // Citation segment
    return (
      <SourceCitation
        key={idx}
        numbers={segment.numbers!}
        sources={sources}
      />
    );
  });
}

/**
 * Process React children and apply citation rendering to text nodes
 */
function processChildren(
  children: React.ReactNode,
  sources: ChatSource[],
  enablePreviews: boolean
): React.ReactNode {
  return React.Children.map(children, (child, idx) => {
    // Only process string children
    if (typeof child === "string") {
      return (
        <React.Fragment key={idx}>
          {renderTextWithCitations(child, sources, enablePreviews)}
        </React.Fragment>
      );
    }
    return child;
  });
}

export function MarkdownRenderer({
  content,
  className,
  sources = [],
  enableCitationPreviews = true,
}: MarkdownRendererProps) {
  // Helper to process children with citation detection
  const withCitations = (children: React.ReactNode) => {
    if (!enableCitationPreviews || sources.length === 0) {
      return children;
    }
    return processChildren(children, sources, true);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("markdown-body", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          // Paragraphs - with citation parsing
          p: ({ children }) => (
            <p className="mb-4 text-[15px] leading-7 text-foreground last:mb-0">
              {withCitations(children)}
            </p>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-xl font-semibold text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-5 text-base font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-sm font-semibold text-foreground first:mt-0">
              {children}
            </h4>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2 text-[15px] leading-7 text-foreground [&>li]:pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2 text-[15px] leading-7 text-foreground [&>li]:pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[15px] leading-7">{withCitations(children)}</li>
          ),

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
            >
              {children}
            </a>
          ),

          // Code
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("font-mono text-sm", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
              {children}
            </pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-border" />,

          // Tables
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-foreground">{children}</td>
          ),
        }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </TooltipProvider>
  );
}
