import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:opacity-90",
        secondary:
          "ll-chip border-border/50 bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:opacity-90",
        outline: "ll-chip bg-transparent text-foreground shadow-none",
        success: "tone-success",
        info: "tone-info",
        warning: "tone-warning",
        neutral: "tone-neutral",
        danger: "tone-danger",
        act: "badge-act",
        judgment: "badge-judgment",
        regulation: "badge-regulation",
        constitution: "badge-constitution",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
