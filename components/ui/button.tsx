import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-[transform,background-color,color,box-shadow,border-color,opacity] duration-200 disabled:pointer-events-none disabled:opacity-100 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:transition-[color,transform,opacity] outline-none focus-visible:ring-[4px] focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "ll-cta-brand",
        ink:
          "ll-button-primary",
        brand:
          "ll-cta-brand",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:-translate-y-px hover:opacity-95 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 disabled:bg-destructive/20 disabled:text-destructive/70 disabled:shadow-none",
        outline:
          "ll-button-outline disabled:border-border/50 disabled:bg-surface-container disabled:text-muted-foreground disabled:shadow-none",
        secondary:
          "ll-button-secondary disabled:bg-surface-container-high disabled:text-muted-foreground disabled:shadow-none",
        ghost:
          "ll-button-ghost bg-transparent disabled:text-muted-foreground",
        tertiary:
          "ll-button-tertiary disabled:text-muted-foreground disabled:no-underline",
        link: "ll-text-link underline-offset-4 disabled:text-muted-foreground",
      },
      size: {
        default: "h-10 px-4 py-2.5 has-[>svg]:px-3.5",
        sm: "h-9 gap-1.5 px-3.5 text-xs has-[>svg]:px-3",
        lg: "h-11 px-6 text-sm has-[>svg]:px-4.5",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
