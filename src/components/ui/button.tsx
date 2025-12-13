import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow-md",
        destructive: "bg-danger-500 text-white shadow-sm hover:bg-danger-600",
        outline: "border border-slate-300 bg-white text-ink-900 hover:bg-cloud-100 hover:border-slate-400",
        secondary: "bg-cloud-100 text-ink-900 hover:bg-slate-200",
        ghost: "text-slate-700 hover:bg-cloud-100 hover:text-ink-900",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
        success: "bg-success-500 text-white shadow-sm hover:bg-success-600",
        warning: "bg-warning-400 text-ink-900 shadow-sm hover:bg-warning-500",
        subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-ink-900",
        premium: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md hover:shadow-lg hover:shadow-primary-500/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        xl: "h-14 rounded-2xl px-8 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
