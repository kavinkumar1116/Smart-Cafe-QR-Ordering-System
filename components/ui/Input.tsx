import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, icon, suffix, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-500">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 transition-all duration-200",
              "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
              "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              icon && "pl-10",
              suffix && "pr-10",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {suffix && (
            <div className="pointer-events-none absolute right-3 flex items-center text-slate-500">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm font-medium text-red-600">{error}</p>
        )}
        {helper && !error && (
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
