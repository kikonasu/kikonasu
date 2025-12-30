import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] rounded-lg font-semibold",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg",
        outline: "border-2 border-foreground bg-transparent text-foreground hover:bg-foreground/5 rounded-lg font-medium",
        secondary: "border-2 border-foreground/20 bg-background text-foreground hover:bg-foreground/5 rounded-lg font-medium",
        ghost: "text-foreground hover:bg-foreground/5 rounded-lg font-normal",
        link: "text-foreground underline-offset-4 hover:underline",
        hero: "bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 shadow-[var(--shadow-medium)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-[var(--transition-smooth)] hover:scale-105 rounded-lg font-semibold",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-14 rounded-lg px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
