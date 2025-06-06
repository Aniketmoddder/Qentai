
// src/components/ui/kbd.tsx
import { cn } from "@/lib/utils";
import React from "react";

export const Kbd = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => {
  return (
    <kbd
      ref={ref}
      className={cn(
        "px-2 py-0.5 text-xs font-mono font-medium text-muted-foreground bg-muted/60 border border-border/50 rounded-md shadow-sm",
        className
      )}
      {...props}
    />
  );
});
Kbd.displayName = "Kbd";
