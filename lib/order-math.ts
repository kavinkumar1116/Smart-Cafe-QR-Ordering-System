interface PriceQuantityItem {
  price?: number | string | null;
  quantity?: number | string | null;
}

export function getGstRate(gstPercentage?: number | string | null): number {
  if (gstPercentage !== undefined && gstPercentage !== null && gstPercentage !== "") {
    const num = Number(gstPercentage);
    if (Number.isFinite(num) && num >= 0) {
      return num > 1 ? num / 100 : num;
    }
  }
  const fromEnv = Number(process.env.NEXT_PUBLIC_GST_RATE);
  if (Number.isFinite(fromEnv) && fromEnv >= 0 && fromEnv <= 0.5) return fromEnv;
  return 0.05;
}

export function calcSubtotal(items: PriceQuantityItem[] | null | undefined): number {
  return (items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

export function calcTax(subtotal: number | string | null | undefined, gstRate = getGstRate()): number {
  return Math.round(Number(subtotal || 0) * gstRate);
}

export function calcGrandTotal(
  subtotal: number | string | null | undefined,
  tax: number | string | null | undefined
): number {
  return Math.round(Number(subtotal || 0) + Number(tax || 0));
}

export function estimatePrepTimeMinutes(itemCount: number | string | null | undefined): number {
  const count = Math.max(0, Number(itemCount || 0));
  const minutes = 8 + count * 3;
  return Math.min(45, Math.max(8, minutes));
}
