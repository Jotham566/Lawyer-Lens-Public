"use client";

import { cn } from "@/lib/utils";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "fade-up" | "fade-in" | "fade-left" | "fade-right" | "scale-in";
  delay?: number;
  as?: "section" | "div" | "article";
}

/* Visible-first: content is never fully hidden, just slightly muted.
   Static renders and full-page captures see ~70% opacity, not blank space. */
const hiddenStyles: Record<string, string> = {
  "fade-up": "opacity-80 translate-y-2",
  "fade-in": "opacity-80",
  "fade-left": "opacity-80 -translate-x-2",
  "fade-right": "opacity-80 translate-x-2",
  "scale-in": "opacity-80 scale-[0.99]",
};

const visibleStyles = "opacity-100 translate-y-0 translate-x-0 scale-100";

export function AnimatedSection({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  as: Tag = "div",
}: AnimatedSectionProps) {
  const [ref, isVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement & HTMLDivElement>}
      className={cn(
        "transition-all duration-500 ease-out",
        isVisible ? visibleStyles : hiddenStyles[variant],
        className
      )}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggered children animation container.
 * Each direct child is wrapped in an AnimatedSection with increasing delay.
 */
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
  variant?: "fade-up" | "fade-in" | "scale-in";
  baseDelay?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerMs = 100,
  variant = "fade-up",
  baseDelay = 0,
}: StaggerContainerProps) {
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div className={className}>
      {childArray.map((child, i) => (
        <AnimatedSection
          key={i}
          variant={variant}
          delay={baseDelay + i * staggerMs}
        >
          {child}
        </AnimatedSection>
      ))}
    </div>
  );
}
