import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void; // For checkbox type
}


const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, checked, onCheckedChange, ...props }, ref) => {
    if (type === "checkbox" && onCheckedChange) {
      return (
        <input
          type="checkbox"
          className={cn( // Basic styling for checkbox, can be enhanced
            "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
            className
          )}
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          {...props}
        />
      )
    }
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
