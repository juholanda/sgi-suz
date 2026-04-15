import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#0038A8] text-white shadow-sm shadow-black/5 hover:bg-[#002d87]",
        destructive:
          "bg-[#DC2626] text-white shadow-sm shadow-black/5 hover:bg-[#B91C1C]",
        outline:
          "border border-[#E2E8F0] bg-white shadow-sm shadow-black/5 hover:bg-[#F8FAFC] hover:text-[#0F172A]",
        secondary:
          "bg-[#EBF0FB] text-[#0038A8] shadow-sm shadow-black/5 hover:bg-[#D6E2F7]",
        ghost: "hover:bg-[#F1F5F9] hover:text-[#0F172A]",
        link: "text-[#0038A8] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9",
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
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
