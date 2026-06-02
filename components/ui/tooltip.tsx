"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type TooltipContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const TooltipCtx = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipCtx.Provider value={{ open, setOpen }}>
      <div
        className="relative w-full"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={() => setOpen(false)}
      >
        {children}
      </div>
    </TooltipCtx.Provider>
  );
}

export function TooltipTrigger({
  children,
  asChild,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  if (asChild) {
    return <>{children}</>;
  }

  return <div className="w-full">{children}</div>;
}

export function TooltipContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TooltipCtx);

  if (!ctx || children == null || children === "") return null;

  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-[70] -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity duration-200",
        ctx.open ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </span>
  );
}
