"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { icon: "h-5 w-5", text: "text-xs" },
  md: { icon: "h-8 w-8", text: "text-sm" },
  lg: { icon: "h-12 w-12", text: "text-base" },
};

/**
 * Centered loading spinner with optional message.
 * Use for full-page or section loading states.
 */
export function LoadingState({
  message = "Loading...",
  className,
  size = "md",
}: LoadingStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className={cn("animate-spin text-primary", config.icon)}
        aria-hidden="true"
      />
      {message && (
        <p className={cn("mt-3 text-muted-foreground", config.text)}>
          {message}
        </p>
      )}
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Inline loading spinner for buttons or inline contexts.
 */
export function InlineLoading({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  const iconSize = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <Loader2
      className={cn("animate-spin", iconSize[size], className)}
      aria-hidden="true"
    />
  );
}

/**
 * Full page loading overlay.
 */
export function PageLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingState message={message} />
    </div>
  );
}

/**
 * Card skeleton for loading states in card layouts.
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton for loading states in tables.
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.random() * 30 + 15}%` }}
        />
      ))}
    </div>
  );
}

/**
 * List skeleton for loading states in list layouts.
 */
export function ListSkeleton({
  items = 5,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
