import React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  title?: string;
  icon?: React.ReactNode;
}

const alertVariants = {
  default: "bg-slate-50 border-slate-200 text-slate-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
  error: "bg-red-50 border-red-200 text-red-900",
  info: "bg-blue-50 border-blue-200 text-blue-900",
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", title, icon, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        alertVariants[variant],
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          {title && <h3 className="font-semibold">{title}</h3>}
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  )
);
Alert.displayName = "Alert";

export { Alert };
