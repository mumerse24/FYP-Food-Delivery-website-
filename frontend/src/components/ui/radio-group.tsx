"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const radioVariants = cva(
  "w-4 h-4 border border-gray-300 rounded-full text-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
)

const Radio = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof radioVariants>
>(({ className, ...props }, ref) => {
  return <input type="radio" ref={ref} className={cn(radioVariants(), className)} {...props} />
})

Radio.displayName = "Radio"

export { Radio }
