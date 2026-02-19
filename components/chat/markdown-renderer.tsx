"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SourceCitation,
  parseSourceCitations,
} from "@/components/citations";
import type { ChatSource } from "@/lib/api/types";

// Common languages to support
const SUPPORTED_LANGUAGES = new Set([
  "javascript", "js", "jsx", "typescript", "ts", "tsx",
  "python", "py", "sql", "json", "html", "css", "scss",
  "bash", "sh", "shell", "yaml", "yml", "markdown", "md",
  "java", "c", "cpp", "csharp", "cs", "go", "rust",
  "ruby", "php", "swift", "kotlin", "scala", "r",
  "xml", "graphql", "dockerfile", "makefile", "toml",
  "ini", "diff", "plaintext", "text", "txt",
]);

// Map common aliases to shiki language names
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  cs: "csharp",
  txt: "plaintext",
  text: "plaintext",
};

/**
 * Extract language from code block className (e.g., "language-javascript" -> "javascript")
 */
function extractLanguage(className?: string): string | undefined {
  if (!className) return undefined;
  const match = className.match(/language-(\w+)/);
  if (!match) return undefined;

  const lang = match[1].toLowerCase();
  const normalized = LANGUAGE_ALIASES[lang] || lang;

  // Only return if it's a supported language
  return SUPPORTED_LANGUAGES.has(lang) || SUPPORTED_LANGUAGES.has(normalized)
    ? normalized
    : undefined;
}

/**
 * HighlightedCodeBlock - Code block with syntax highlighting and copy button
 * Uses shiki for syntax highlighting with dual theme support (light/dark)
 * Falls back to plain code while loading or for unsupported languages
 */
function HighlightedCodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [highlightedHtml, setHighlightedHtml] = React.useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Lazy load shiki and highlight code
  React.useEffect(() => {
    if (!language) return;

    let cancelled = false;

    const highlight = async () => {
      try {
        const { codeToHtml } = await import("shiki");

        if (cancelled) return;

        const html = await codeToHtml(code, {
          lang: language,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
        });

        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch (err) {
        // Silently fail - will show plain code fallback
        console.warn("Syntax highlighting failed:", err);
      }
    };

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  // CSS for shiki dual themes - applies correct theme based on class
  const shikiStyles = `
    .shiki,
    .shiki span {
      color: var(--shiki-light);
      background-color: var(--shiki-light-bg);
    }
    .dark .shiki,
    .dark .shiki span {
      color: var(--shiki-dark);
      background-color: var(--shiki-dark-bg);
    }
  `;

  return (
    <div className="relative group mb-4">
      <style dangerouslySetInnerHTML={{ __html: shikiStyles }} />

      {highlightedHtml ? (
        <div
          className="[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:pr-12 [&_pre]:text-sm [&_pre]:!bg-muted [&_code]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 pr-12 font-mono text-sm">
          <code>{code}</code>
        </pre>
      )}

      {/* Language label */}
      {language && (
        <span className="absolute top-2 left-3 text-[10px] uppercase tracking-wide text-muted-foreground/60 font-medium">
          {language}
        </span>
      )}

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "absolute top-2 right-2 p-2 rounded-md transition-all",
          "bg-background/80 border border-border/50 shadow-sm",
          "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
          // Mobile: always visible (opacity-70 for subtle appearance)
          // Desktop: hidden until hover
          "opacity-70 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
        )}
        aria-label={copied ? "Copied!" : "Copy code"}
        title={copied ? "Copied!" : "Copy code"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

/**
 * CodeBlock - Code block wrapper that extracts language and code text
 * Shows copy button on hover (desktop) or always (mobile via touch)
 */
function CodeBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  // Extract language from the code element's className
  const language = extractLanguage(className);

  // Extract text content from children
  const code = React.useMemo(() => {
    // Get text content from children (handles both string and React elements)
    const extractText = (node: React.ReactNode): string => {
      if (typeof node === "string") return node;
      if (typeof node === "number") return String(node);
      if (Array.isArray(node)) return node.map(extractText).join("");
      if (React.isValidElement(node)) {
        const props = node.props as { children?: React.ReactNode };
        return extractText(props.children);
      }
      return "";
    };
    return extractText(children);
  }, [children]);

  return <HighlightedCodeBlock code={code} language={language} />;
}


interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** Sources for citation linking (indexed by number [1], [2], etc.) */
  sources?: ChatSource[];
  /** Enable citation preview on hover */
  enableCitationPreviews?: boolean;
  /** Whether content is still streaming (defer math rendering) */
  isStreaming?: boolean;
}

// Memoized markdown components to avoid recreation on each render
const createMarkdownComponents = (
  withCitations: (children: React.ReactNode) => React.ReactNode
) => ({
  // Paragraphs - with citation parsing
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4 text-[15px] leading-7 text-foreground last:mb-0">
      {withCitations(children)}
    </p>
  ),

  // Headings
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-4 mt-6 text-xl font-semibold text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-3 mt-6 text-lg font-semibold text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-3 mt-5 text-base font-semibold text-foreground first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mb-2 mt-4 text-sm font-semibold text-foreground first:mt-0">
      {children}
    </h4>
  ),

  // Lists
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-4 ml-6 list-disc space-y-2 text-[15px] leading-7 text-foreground [&>li]:pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-4 ml-6 list-decimal space-y-2 text-[15px] leading-7 text-foreground [&>li]:pl-1">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-[15px] leading-7">{withCitations(children)}</li>
  ),

  // Strong and emphasis
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),

  // Links
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
    >
      {children}
    </a>
  ),

  // Code - handles both inline and block code
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    // If no className, it's inline code
    if (!className) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
          {children}
        </code>
      );
    }
    // Block code - just return children, CodeBlock handles highlighting
    return <>{children}</>;
  },
  // Pre wraps code blocks - pass className from child code element
  pre: ({ children }: { children?: React.ReactNode }) => {
    // Extract className from the code child element for language detection
    let codeClassName: string | undefined;
    let codeChildren: React.ReactNode = children;

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === "code") {
        const props = child.props as { className?: string; children?: React.ReactNode };
        codeClassName = props.className;
        codeChildren = props.children;
      }
    });

    return <CodeBlock className={codeClassName}>{codeChildren}</CodeBlock>;
  },

  // Blockquotes
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="mb-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="my-6 border-border" />,

  // Tables
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted/50">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-border last:border-0">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-3 text-foreground">{children}</td>
  ),
});

/**
 * Auto-render math expressions in a DOM element.
 * Finds $...$ (inline) and $$...$$ (display) and renders them with KaTeX.
 */
type KatexLike = {
  render: (
    tex: string,
    element: HTMLElement,
    options?: Record<string, unknown>
  ) => void;
};

function renderMathInElement(
  element: HTMLElement,
  katex: KatexLike
): void {
  const delimiters = [
    { left: "$$", right: "$$", display: true },
    { left: "$", right: "$", display: false },
  ];

  const renderMath = (text: string): DocumentFragment => {
    const fragment = document.createDocumentFragment();
    let remaining = text;

    while (remaining.length > 0) {
      let found = false;

      for (const delimiter of delimiters) {
        const startIdx = remaining.indexOf(delimiter.left);
        if (startIdx === -1) continue;

        // For $, make sure it's not $$
        if (delimiter.left === "$" && remaining[startIdx + 1] === "$") {
          continue;
        }

        const searchStart = startIdx + delimiter.left.length;
        let endIdx = remaining.indexOf(delimiter.right, searchStart);

        // For $, make sure we don't match $$
        if (delimiter.left === "$" && delimiter.right === "$") {
          while (endIdx !== -1 && remaining[endIdx + 1] === "$") {
            endIdx = remaining.indexOf(delimiter.right, endIdx + 2);
          }
        }

        if (endIdx === -1) continue;

        // Add text before math
        if (startIdx > 0) {
          fragment.appendChild(document.createTextNode(remaining.slice(0, startIdx)));
        }

        // Render math
        const mathContent = remaining.slice(searchStart, endIdx);
        const mathSpan = document.createElement("span");

        if (delimiter.display) {
          mathSpan.className = "block my-4 overflow-x-auto";
        }

        try {
          katex.render(mathContent, mathSpan, {
            displayMode: delimiter.display,
            throwOnError: false,
            strict: false,
          });
        } catch {
          mathSpan.textContent = delimiter.left + mathContent + delimiter.right;
        }

        fragment.appendChild(mathSpan);
        remaining = remaining.slice(endIdx + delimiter.right.length);
        found = true;
        break;
      }

      if (!found) {
        // No more math found, add remaining text
        fragment.appendChild(document.createTextNode(remaining));
        break;
      }
    }

    return fragment;
  };

  // Process text nodes
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.includes("$")) {
      textNodes.push(node as Text);
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.textContent || "";
    if (!text.includes("$")) continue;

    const fragment = renderMath(text);
    textNode.parentNode?.replaceChild(fragment, textNode);
  }
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

function MarkdownRendererInner({
  content,
  className,
  sources = [],
  enableCitationPreviews = true,
  isStreaming = false,
}: MarkdownRendererProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // Dynamic imports require flexible typing - react-markdown types are complex
  const [MarkdownComponent, setMarkdownComponent] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.useState<React.ComponentType<any> | null>(null);
  const [remarkGfmPlugin, setRemarkGfmPlugin] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    React.useState<((...args: any[]) => any) | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ default: ReactMarkdown }, { default: remarkGfm }] = await Promise.all([
        import("react-markdown"),
        import("remark-gfm"),
      ]);
      if (!cancelled) {
        setMarkdownComponent(() => ReactMarkdown);
        setRemarkGfmPlugin(() => remarkGfm);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Process math expressions after render, but only when not streaming
  React.useEffect(() => {
    if (!isStreaming && containerRef.current && content.includes("$")) {
      let cancelled = false;
      const timer = setTimeout(() => {
        void (async () => {
          const { default: katex } = await import("katex");
          if (!cancelled && containerRef.current) {
            renderMathInElement(containerRef.current, katex);
          }
        })();
      }, 10);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [content, isStreaming]);

  // Helper to process children with citation detection
  const withCitations = React.useCallback((children: React.ReactNode) => {
    if (!enableCitationPreviews || sources.length === 0) {
      return children;
    }
    return processChildren(children, sources, true);
  }, [enableCitationPreviews, sources]);

  // Memoize components to avoid recreation on each render
  const components = React.useMemo(
    () => createMarkdownComponents(withCitations),
    [withCitations]
  );

  if (!MarkdownComponent || !remarkGfmPlugin) {
    return (
      <div ref={containerRef} className={cn("markdown-body", className)}>
        <p className="text-[15px] leading-7 text-foreground whitespace-pre-wrap">
          {content}
        </p>
      </div>
    );
  }

  const Markdown = MarkdownComponent;

  return (
    <div ref={containerRef} className={cn("markdown-body", className)}>
      <Markdown remarkPlugins={[remarkGfmPlugin]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}

/**
 * Memoized markdown renderer with smart comparison
 * Skips re-render if content only added to end (streaming optimization)
 */
export const MarkdownRenderer = React.memo(
  MarkdownRendererInner,
  (prevProps, nextProps) => {
    // During streaming, only re-render when content changes significantly
    // or when streaming ends
    if (prevProps.isStreaming && nextProps.isStreaming) {
      // During streaming, throttle re-renders to every ~50 characters
      const lengthDiff = nextProps.content.length - prevProps.content.length;
      if (lengthDiff > 0 && lengthDiff < 50) {
        // Small incremental change during streaming - skip render
        return true;
      }
    }

    // Always re-render if:
    // - streaming state changed
    // - content changed (beyond streaming threshold)
    // - sources changed
    // - citation preview setting changed
    // - className changed
    return (
      prevProps.content === nextProps.content &&
      prevProps.isStreaming === nextProps.isStreaming &&
      prevProps.className === nextProps.className &&
      prevProps.enableCitationPreviews === nextProps.enableCitationPreviews &&
      prevProps.sources === nextProps.sources
    );
  }
);
