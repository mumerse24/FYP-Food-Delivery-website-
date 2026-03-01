"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
)

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & VariantProps<typeof textareaVariants>
>(({ className, ...props }, ref) => {
  return <textarea ref={ref} className={cn(textareaVariants(), className)} {...props} />
})

Textarea.displayName = "Textarea"

export { Textarea }
