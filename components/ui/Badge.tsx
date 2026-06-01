import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-800",
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-yellow-100 text-yellow-800",
        error: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        primary: "bg-emerald-600 text-white",
        secondary: "bg-slate-600 text-white",
        outline: "border border-slate-300 text-slate-700 bg-transparent",
      },
      size: {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, ...props }, ref) => (
    <div
      className={cn(badgeVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {props.children}
    </div>
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
