"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "group inline-flex items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-medium text-muted-foreground transition-[transform,background-color,color,box-shadow,border-color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-[color:var(--interactive-hover-border)] data-[state=on]:bg-[var(--interactive-hover-surface-strong)] data-[state=on]:text-[var(--interactive-hover-foreground)] data-[state=on]:shadow-soft hover:-translate-y-px hover:bg-[var(--interactive-hover-surface)] hover:text-[var(--interactive-hover-foreground)] hover:border-[color:var(--interactive-hover-border)] hover:shadow-soft [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:transition-[color,transform,opacity] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border-glass bg-surface-container-lowest/90 text-foreground shadow-soft data-[state=on]:bg-[var(--interactive-hover-surface-strong)] hover:bg-[var(--interactive-hover-surface)]",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
