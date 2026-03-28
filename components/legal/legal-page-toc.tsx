"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  label: string;
}

interface LegalPageTocProps {
  items: TocItem[];
}

/**
 * Sticky sidebar TOC for legal pages (Privacy, Terms).
 * Mobile: collapsible "On this page" dropdown.
 * Desktop: sticky sidebar with active-section highlighting.
 */
export function LegalPageToc({ items }: LegalPageTocProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile — collapsible dropdown */}
      <nav aria-label="Page sections" className="mb-8 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-container-low"
        >
          <span className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-gold">
              On this page
            </span>
            <span className="text-muted-foreground">
              — {items.find((i) => i.id === activeId)?.label || items[0]?.label}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              mobileOpen && "rotate-180"
            )}
          />
        </button>
        {mobileOpen && (
          <div className="mt-2 rounded-lg border border-border/40 bg-card p-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  activeId === item.id
                    ? "bg-brand-gold/10 font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Desktop — sticky sidebar */}
      <aside className="hidden h-full lg:block" aria-label="Table of contents">
        <div className="sticky top-40">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            On this page
          </p>
          <ul className="mt-3 space-y-0.5 border-l border-border/30 pl-0">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(item.id)}
                  className={cn(
                    "block w-full truncate border-l-2 py-1.5 pl-4 pr-2 text-left text-[13px] transition-all -ml-px",
                    activeId === item.id
                      ? "border-brand-gold font-semibold text-foreground"
                      : "border-transparent text-muted-foreground/70 hover:border-border/60 hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}
