import type { QrMenuCategory, QrMenuItem, QrMenuResponse } from "@/types/qr-menu";

export const QR_MENU_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQrMenuCategory(value: unknown): value is QrMenuCategory {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.image_url === "string" &&
    typeof value.is_available === "boolean"
  );
}

function isQrMenuItem(value: unknown): value is QrMenuItem {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.price === "number" &&
    typeof value.category === "string" &&
    typeof value.image_url === "string" &&
    typeof value.is_available === "boolean"
  );
}

export function isQrMenuResponse(value: unknown): value is QrMenuResponse {
  return (
    isRecord(value) &&
    typeof value.success === "boolean" &&
    typeof value.tableNo === "string" &&
    (value.restaurantDetails === null || isRecord(value.restaurantDetails)) &&
    Array.isArray(value.category) &&
    Array.isArray(value.menuItems) &&
    value.category.every(isQrMenuCategory) &&
    value.menuItems.every(isQrMenuItem)
  );
}

export function getCategoryNameById(categories: QrMenuCategory[]) {
  return new Map(categories.map((category) => [String(category.id), category.name]));
}

export function getTenantDisplayName(tenantSlug: string) {
  return tenantSlug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
