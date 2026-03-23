"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "draft"
  | "published"
  | "archived";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<
  StatusType,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "info" | "warning" | "neutral" | "danger";
    dotColor: string;
  }
> = {
  active: {
    label: "Active",
    variant: "success",
    dotColor: "bg-primary",
  },
  inactive: {
    label: "Inactive",
    variant: "neutral",
    dotColor: "bg-muted-foreground",
  },
  pending: {
    label: "Pending",
    variant: "warning",
    dotColor: "bg-primary",
  },
  success: {
    label: "Success",
    variant: "success",
    dotColor: "bg-primary",
  },
  error: {
    label: "Error",
    variant: "danger",
    dotColor: "bg-destructive",
  },
  warning: {
    label: "Warning",
    variant: "warning",
    dotColor: "bg-primary",
  },
  info: {
    label: "Info",
    variant: "info",
    dotColor: "bg-muted-foreground",
  },
  draft: {
    label: "Draft",
    variant: "neutral",
    dotColor: "bg-muted-foreground",
  },
  published: {
    label: "Published",
    variant: "success",
    dotColor: "bg-primary",
  },
  archived: {
    label: "Archived",
    variant: "neutral",
    dotColor: "bg-muted-foreground",
  },
};

/**
 * Status badge component for displaying entity states.
 * Consistent styling across the application for status indicators.
 */
export function StatusBadge({
  status,
  label,
  className,
  showDot = false,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("font-normal", className)}>
      {showDot && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            config.dotColor
          )}
          aria-hidden="true"
        />
      )}
      {label || config.label}
    </Badge>
  );
}

/**
 * Role badge for organization member roles.
 */
export function RoleBadge({
  role,
  className,
}: {
  role: "owner" | "admin" | "member";
  className?: string;
}) {
  const roleConfig = {
    owner: {
      label: "Owner",
      variant: "warning" as const,
    },
    admin: {
      label: "Admin",
      variant: "success" as const,
    },
    member: {
      label: "Member",
      variant: "secondary" as const,
    },
  };

  const config = roleConfig[role];

  return (
    <Badge variant={config.variant} className={cn("font-normal", className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Subscription tier badge.
 */
export function TierBadge({
  tier,
  className,
}: {
  tier: "free" | "professional" | "team" | "enterprise";
  className?: string;
}) {
  const tierConfig = {
    free: {
      label: "Free",
      variant: "neutral" as const,
    },
    professional: {
      label: "Professional",
      variant: "success" as const,
    },
    team: {
      label: "Team",
      variant: "info" as const,
    },
    enterprise: {
      label: "Enterprise",
      variant: "warning" as const,
    },
  };

  const config = tierConfig[tier];

  return (
    <Badge variant={config.variant} className={cn("font-normal", className)}>
      {config.label}
    </Badge>
  );
}

/**
 * Document type badge for legal documents.
 */
export function DocumentTypeBadge({
  type,
  className,
}: {
  type: "act" | "judgment" | "regulation" | "constitution" | "contract";
  className?: string;
}) {
  const typeConfig = {
    act: {
      label: "Act",
      variant: "act" as const,
    },
    judgment: {
      label: "Judgment",
      variant: "judgment" as const,
    },
    regulation: {
      label: "Regulation",
      variant: "regulation" as const,
    },
    constitution: {
      label: "Constitution",
      variant: "constitution" as const,
    },
    contract: {
      label: "Contract",
      variant: "neutral" as const,
    },
  };

  const config = typeConfig[type];

  return (
    <Badge variant={config.variant} className={cn("font-normal", className)}>
      {config.label}
    </Badge>
  );
}
