"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  exportToCsv,
  exportToExcel,
  type ExportColumn,
} from "@/lib/export";

export type { ExportColumn };

export type ExportDropdownProps<T> = {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  buttonClassName?: string;
};

function defaultFilename(base: string): string {
  const stamp = new Date().toISOString().split("T")[0];
  return `${base}-${stamp}`;
}

export default function ExportDropdown<T>({
  data,
  columns,
  filename = defaultFilename("export"),
  disabled = false,
  label = "Export",
  className,
  buttonClassName,
}: ExportDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const isDisabled = disabled || data.length === 0 || columns.length === 0;

  const handleExport = (format: "csv" | "xlsx") => {
    if (isDisabled) return;

    if (format === "csv") {
      exportToCsv(data, columns, filename);
    } else {
      exportToExcel(data, columns, filename);
    }

    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName
        )}
      >
        <Download size={16} />
        {label}
        <ChevronDown
          size={16}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 min-w-[12rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport("xlsx")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Excel (.xlsx)
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport("csv")}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <FileText size={16} className="text-blue-600" />
            CSV (.csv)
          </button>
        </div>
      )}
    </div>
  );
}
