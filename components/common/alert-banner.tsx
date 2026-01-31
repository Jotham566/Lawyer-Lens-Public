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
    containerClass:
      "border-green-500/50 bg-green-50 dark:bg-green-900/20",
    iconClass: "text-green-600 dark:text-green-400",
    titleClass: "text-green-800 dark:text-green-200",
    messageClass: "text-green-600 dark:text-green-400",
  },
  error: {
    icon: AlertCircle,
    containerClass:
      "border-destructive/50 bg-destructive/10",
    iconClass: "text-destructive",
    titleClass: "text-destructive",
    messageClass: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      "border-amber-500/50 bg-amber-50 dark:bg-amber-900/20",
    iconClass: "text-amber-600 dark:text-amber-400",
    titleClass: "text-amber-800 dark:text-amber-200",
    messageClass: "text-amber-600 dark:text-amber-400",
  },
  info: {
    icon: Info,
    containerClass:
      "border-blue-500/50 bg-blue-50 dark:bg-blue-900/20",
    iconClass: "text-blue-600 dark:text-blue-400",
    titleClass: "text-blue-800 dark:text-blue-200",
    messageClass: "text-blue-600 dark:text-blue-400",
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
        "flex items-start gap-3 rounded-lg border p-4",
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
