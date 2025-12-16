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
    className: string;
    dotColor: string;
  }
> = {
  active: {
    label: "Active",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dotColor: "bg-green-500",
  },
  inactive: {
    label: "Inactive",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    dotColor: "bg-gray-500",
  },
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  success: {
    label: "Success",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dotColor: "bg-green-500",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dotColor: "bg-red-500",
  },
  warning: {
    label: "Warning",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dotColor: "bg-amber-500",
  },
  info: {
    label: "Info",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    dotColor: "bg-blue-500",
  },
  draft: {
    label: "Draft",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    dotColor: "bg-gray-500",
  },
  published: {
    label: "Published",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dotColor: "bg-green-500",
  },
  archived: {
    label: "Archived",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
    dotColor: "bg-slate-500",
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
    <Badge className={cn("font-normal", config.className, className)}>
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
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    admin: {
      label: "Admin",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    member: {
      label: "Member",
      className: "",
    },
  };

  const config = roleConfig[role];

  if (role === "member") {
    return (
      <Badge variant="secondary" className={className}>
        {config.label}
      </Badge>
    );
  }

  return (
    <Badge className={cn("font-normal", config.className, className)}>
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
      className:
        "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    },
    professional: {
      label: "Professional",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    team: {
      label: "Team",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    enterprise: {
      label: "Enterprise",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
  };

  const config = tierConfig[tier];

  return (
    <Badge className={cn("font-normal", config.className, className)}>
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
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    judgment: {
      label: "Judgment",
      className:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    regulation: {
      label: "Regulation",
      className:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    },
    constitution: {
      label: "Constitution",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    contract: {
      label: "Contract",
      className:
        "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
    },
  };

  const config = typeConfig[type];

  return (
    <Badge className={cn("font-normal", config.className, className)}>
      {config.label}
    </Badge>
  );
}
