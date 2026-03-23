import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "ll-field file:text-foreground selection:bg-primary selection:text-primary-foreground h-11 w-full min-w-0 px-3 py-2 text-base outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted-foreground disabled:opacity-100 md:text-sm",
        "aria-invalid:border-b-destructive aria-invalid:shadow-[0_2px_0_0_color-mix(in_srgb,var(--destructive)_28%,transparent)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
