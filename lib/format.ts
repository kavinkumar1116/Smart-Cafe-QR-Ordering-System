import type { NumericValue } from "@/types/cafe";

export function formatCurrency(value: NumericValue | null | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function makeOrderCode(): string {
  return `SC-${Date.now().toString().slice(-6)}`;
}
