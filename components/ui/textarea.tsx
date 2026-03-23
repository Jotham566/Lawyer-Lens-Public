import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "ll-field flex min-h-[72px] w-full rounded-2xl px-4 py-3 text-base focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-muted-foreground disabled:opacity-100 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
