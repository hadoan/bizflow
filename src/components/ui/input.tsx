import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-base text-ink-900 placeholder:text-slate-400 transition-all duration-200",
          "hover:border-slate-400",
          "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
