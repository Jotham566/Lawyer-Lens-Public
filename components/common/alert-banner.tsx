"use client";

import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertBannerProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
}

const variantConfig: Record<
  AlertVariant,
  {
    icon: typeof AlertCircle;
    containerClass: string;
    iconClass: string;
    titleClass: string;
    messageClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: "border-border/40 bg-card/80",
    iconClass: "text-primary",
    titleClass: "text-foreground",
    messageClass: "text-muted-foreground",
  },
  error: {
    icon: AlertCircle,
    containerClass: "border-destructive/30 bg-destructive/10",
    iconClass: "text-destructive",
    titleClass: "text-destructive",
    messageClass: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-border/40 bg-muted/50",
    iconClass: "text-primary",
    titleClass: "text-foreground",
    messageClass: "text-muted-foreground",
  },
  info: {
    icon: Info,
    containerClass: "border-border/40 bg-card/80",
    iconClass: "text-muted-foreground",
    titleClass: "text-foreground",
    messageClass: "text-muted-foreground",
  },
};

/**
 * Alert banner component for displaying feedback messages.
 * Supports success, error, warning, and info variants.
 * Used for form validation, API responses, and system notifications.
 */
export function AlertBanner({
  variant,
  title,
  message,
  onDismiss,
  className,
  action,
}: AlertBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-sm",
        config.containerClass,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon
        className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconClass)}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("font-medium text-sm", config.titleClass)}>
            {title}
          </p>
        )}
        <p className={cn("text-sm", title && "mt-1", config.messageClass)}>
          {message}
        </p>
        {action && (
          <Button
            variant="link"
            size="sm"
            className={cn("h-auto p-0 mt-2", config.messageClass)}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        )}
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Inline alert for form fields or smaller contexts.
 */
export function InlineAlert({
  variant,
  message,
  className,
}: {
  variant: AlertVariant;
  message: string;
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn("flex items-center gap-2 text-sm", config.messageClass, className)}
      role="alert"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
