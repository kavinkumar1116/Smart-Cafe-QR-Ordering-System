"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt, UtensilsCrossed, ShoppingBag, Minus, Plus, Search, Send, ShoppingCart, Trash2, X, Info } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { calcSubtotal } from "@/lib/order-math";
import { tenantApiFetch } from "@/lib/tenant";
import type { CafeTable, CartItem as CartEntry, Category, MenuItem, OrderMode } from "@/types/cafe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNCATEGORIZED = "Uncategorized";

function getMenuCategory(item: MenuItem): string {
  return typeof item.category === "string" && item.category.trim() !== ""
    ? item.category
    : UNCATEGORIZED;
}

function getRawCategoryValue(item: MenuItem): string | number | null | undefined {
  return item.category as string | number | null | undefined;
}

function normalizeMenuCategory(item: MenuItem, categoryById: Map<number, string>): string {
  const rawCategory = getRawCategoryValue(item);

  if (typeof rawCategory === "number") {
    return categoryById.get(rawCategory) || UNCATEGORIZED;
  }

  if (typeof rawCategory === "string") {
    const trimmedCategory = rawCategory.trim();
    const numericCategoryId = Number(trimmedCategory);

    if (trimmedCategory && Number.isInteger(numericCategoryId)) {
      return categoryById.get(numericCategoryId) || UNCATEGORIZED;
    }

    return trimmedCategory || UNCATEGORIZED;
  }

  return UNCATEGORIZED;
}

function normalizeMenuItems(menuItems: MenuItem[] | null | undefined, categories: Category[]): MenuItem[] {
  const categoryById = new Map(
    categories
      .filter((category) => category.is_available !== false)
      .map((category) => [Number(category.id), String(category.name || "").trim()] as const)
      .filter(([id, name]) => Number.isFinite(id) && name !== "")
  );

  return (menuItems || []).map((item) => ({
    ...item,
    category: normalizeMenuCategory(item, categoryById),
  }));
}

interface CategoriesResponse {
  items?: Category[];
  error?: string;
  detail?: string;
}

interface MenuMasterResponse {
  menuItems?: MenuItem[];
  error?: string;
  detail?: string;
}

interface TablesResponse {
  tables?: CafeTable[];
  error?: string;
  detail?: string;
}

interface MenuSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

interface QuantityControlProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

interface ProductCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onChangeQuantity: (id: number, delta: number) => void;
}

interface CategorySectionProps {
  category: string;
  items: MenuItem[];
  cartQuantities: Map<number, number>;
  onAdd: (item: MenuItem) => void;
  onChangeQuantity: (id: number, delta: number) => void;
}

interface CurrentCartProps {
  cart: CartEntry[];
  totalItems: number;
  grandTotal: number;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
  onPlaceOrder: () => void;
  placingOrder: boolean;
}

interface CartItemProps {
  item: CartEntry;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
}

interface CartSummaryProps {
  totalItems: number;
  grandTotal: number;
  onPlaceOrder: () => void;
  placingOrder: boolean;
}

interface CustomerForm {
  customer_name: string;
  customer_mobile: string;
  table_number: string;
  order_type: OrderMode;
}

interface CustomerDetailsModalProps {
  open: boolean;
  placingOrder: boolean;
  error: string;
  customer: CustomerForm;
  tables: CafeTable[];
  onCustomerChange: (customer: CustomerForm) => void;
  onClose: () => void;
  onConfirm: () => void;
}

interface StickyCartBarProps {
  href: string;
  itemCount: number;
  total: number;
}

interface MenuGroup {
  category: string;
  items: MenuItem[];
}

interface MenuExperienceProps {
  tableId?: string;
}

function MenuSearchBar({ value, onChange }: MenuSearchBarProps) {
  return (
    <label className="relative block">
      <span className="sr-only">Search menu</span>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search menu"
        className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}

function CategoryChips({ categories, active, onChange }: CategoryChipsProps) {
  const safeCategories = categories.filter((c): c is string => typeof c === "string");

  return (
    <div className="flex flex-wrap gap-2">
      {safeCategories.map((category) => {
        const isActive = category === active;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isActive
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
                : "text-slate-700 hover:bg-slate-100"
              }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

const QuantityControl = memo(function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: QuantityControlProps) {
  return (
    <div className="grid h-10 w-full grid-cols-[40px_1fr_40px] items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
        onClick={onDecrease}
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="text-center text-sm font-semibold text-slate-900">{Math.max(1, quantity)}</span>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition hover:bg-slate-200"
        onClick={onIncrease}
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
});

const ProductCard = memo(function ProductCard({
  item,
  quantity,
  onAdd,
  onChangeQuantity,
}: ProductCardProps) {
  const price = Number(item.price || 0);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="aspect-square overflow-hidden bg-slate-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="space-y-2">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {getMenuCategory(item)}
          </span>
          <h3 className="text-base font-medium text-slate-900">{item.name}</h3>
          <p className="text-sm font-medium text-slate-700">{formatCurrency(price)}</p>
        </div>
        {quantity > 0 ? (
          <QuantityControl
            quantity={quantity}
            onDecrease={() => onChangeQuantity(item.id, -1)}
            onIncrease={() => onChangeQuantity(item.id, 1)}
          />
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
});

const CategorySection = memo(function CategorySection({
  category,
  items,
  cartQuantities,
  onAdd,
  onChangeQuantity,
}: CategorySectionProps) {
  return (
    <section>
      <div className="grid items-start gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            item={item}
            quantity={cartQuantities.get(item.id) || 0}
            onAdd={onAdd}
            onChangeQuantity={onChangeQuantity}
          />
        ))}
      </div>
    </section>
  );
});

function CartItem({ item, onIncrement, onDecrement, onRemove }: CartItemProps) {
  const itemTotal = Number(item.price || 0) * Math.max(0, Number(item.quantity || 0));

  return (
    <div className="grid grid-cols-[58px_1fr] gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="h-14 w-14 overflow-hidden rounded-lg bg-slate-100">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-slate-200" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="line-clamp-2 text-sm font-medium leading-5 text-slate-900">
            {item.name}
          </p>
          <span className="shrink-0 text-[15px] font-semibold text-slate-900">
            {formatCurrency(itemTotal)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">{formatCurrency(item.price)} each</span>
            <span className="w-[3px] h-[3px] rounded-full bg-slate-300" />

            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
              <button
                type="button"
                onClick={() => onDecrement(item.id)}
                className="text-slate-500 hover:text-slate-900 transition"
                aria-label="Decrease quantity"
              >
                <Minus size={11} />
              </button>
              <span className="min-w-[14px] text-center text-[13px] font-medium text-slate-900">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onIncrement(item.id)}
                className="text-slate-500 hover:text-slate-900 transition"
                aria-label="Increase quantity"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100 hover:border-rose-300"
          >
            <Trash2 size={13} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function CartSummary({ totalItems, grandTotal, onPlaceOrder, placingOrder }: CartSummaryProps) {
  const isEmpty = totalItems === 0;

  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Total items</span>
        <span className="font-semibold text-slate-900">{totalItems}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-lg font-semibold text-slate-900">
        <span>Grand total</span>
        <span>{formatCurrency(Number.isFinite(grandTotal) ? grandTotal : 0)}</span>
      </div>
      <button
        type="button"
        disabled={isEmpty || placingOrder}
        onClick={onPlaceOrder}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send size={18} aria-hidden="true" />
        {placingOrder ? "Placing..." : "Place Order"}
      </button>
    </div>
  );
}

function CurrentCart({
  cart,
  totalItems,
  grandTotal,
  onIncrement,
  onDecrement,
  onRemove,
  onPlaceOrder,
  placingOrder,
}: CurrentCartProps) {
  return (
    <aside className="glass-panel sticky top-6 flex max-h-[calc(90vh-3rem)] min-h-[420px] flex-col rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">Current Cart</h3>
        <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {totalItems}
        </span>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
            <ShoppingCart className="mx-auto text-emerald-600" size={30} aria-hidden="true" />
            <p className="mt-3 font-medium text-slate-900">Your cart is empty.</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Add items from the menu to start an order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </div>

      <CartSummary
        totalItems={totalItems}
        grandTotal={grandTotal}
        onPlaceOrder={onPlaceOrder}
        placingOrder={placingOrder}
      />
    </aside>
  );
}

function CustomerDetailsModal({
  open,
  placingOrder,
  error,
  customer,
  tables,
  onCustomerChange,
  onClose,
  onConfirm,
}: CustomerDetailsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
  <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">

    {/* Emerald top bar */}
    <div className="flex items-center justify-between bg-green-600 px-5 py-3.5">
      <div className="flex items-center gap-2 text-white">
        <Receipt size={17} aria-hidden="true" />
        <span className="text-sm font-medium">Customer Billing Details</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
          Smart Cafe
        </span>
        <button
          type="button"
          onClick={onClose}
          disabled={placingOrder}
          className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-300 transition hover:text-white disabled:opacity-60"
          aria-label="Close"
        >
          <X size={17} />
        </button>
      </div>
    </div>

    <div className="p-5">

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="space-y-4">

        {/* Order Type toggle cards — shown first so table field reacts immediately */}
        <div>
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Order type <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {(["Dine-In", "Takeaway"] as OrderMode[]).map((type) => {
              const active = customer.order_type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    onCustomerChange({
                      ...customer,
                      order_type: type,
                      // clear table number when switching away from Dine-In
                      table_number: type === "Takeaway" ? "" : customer.table_number,
                    })
                  }
                  disabled={placingOrder}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition disabled:opacity-60 ${
                    active
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {type === "Dine-In" ? (
                    <UtensilsCrossed size={20} aria-hidden="true" />
                  ) : (
                    <ShoppingBag size={20} aria-hidden="true" />
                  )}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
          Customer info
        </p>

        {/* Table Number — only for Dine-In */}
        {customer.order_type === "Dine-In" ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">
              Table number <span className="text-red-500">*</span>
            </span>
            <Select
              value={customer.table_number}
              onValueChange={(value) => onCustomerChange({ ...customer, table_number: value })}
              disabled={placingOrder}
            >
              <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50 text-sm">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 bg-white shadow-lg">
                {tables.map((table) => (
                  <SelectItem key={table.id} value={String(table.table_number)}>
                    Table {table.table_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ) : null}

        {/* Mobile Number */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">
            Mobile number <span className="text-red-500">*</span>
          </span>
          <input
            type="tel"
            inputMode="numeric"
            minLength={10}
            maxLength={10}
            value={customer.customer_mobile}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, "").slice(0, 10);
              onCustomerChange({ ...customer, customer_mobile: value });
            }}
            disabled={placingOrder}
            placeholder="10-digit number"
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
          />
        </label>

        {/* Customer Name */}
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-500">Customer name</span>
          <input
            value={customer.customer_name}
            onChange={(event) => onCustomerChange({ ...customer, customer_name: event.target.value })}
            disabled={placingOrder}
            placeholder="Enter name (optional)"
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
          />
        </label>

        {/* Footer buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={placingOrder}
            className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={placingOrder}
            className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            <Send size={15} aria-hidden="true" />
            {placingOrder ? "Confirming..." : "Confirm order"}
          </button>
        </div>

      </div>
    </div>
  </div>
</div>
  );
}

function StickyCartBar({ href, itemCount, total }: StickyCartBarProps) {
  if (itemCount === 0) {
    return null;
  }

  return (
    <Link
      href={href}
      className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 xl:hidden"
    >
      <span className="inline-flex items-center gap-2">
        <ShoppingCart size={18} aria-hidden="true" />
        {itemCount} item{itemCount === 1 ? "" : "s"}
      </span>
      <span>{formatCurrency(total)}</span>
    </Link>
  );
}

export default function Order({ tableId }: MenuExperienceProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [customer, setCustomer] = useState<CustomerForm>({
    customer_name: "",
    customer_mobile: "",
    table_number: "",
    order_type: "Dine-In",
  });

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setError("");

      try {
        const [categoryResponse, menuResponse, tablesResponse] = await Promise.all([
          tenantApiFetch("/api/admin/category"),
          tenantApiFetch("/api/admin/menu_master"),
          tenantApiFetch("/api/admin/tables"),
        ]);
        const categoryData = (await categoryResponse.json()) as CategoriesResponse;
        const menuData = (await menuResponse.json()) as MenuMasterResponse;
        const tablesData = (await tablesResponse.json()) as TablesResponse;

        if (!categoryResponse.ok || !menuResponse.ok || !tablesResponse.ok) {
          throw new Error(
            categoryData.error ||
            categoryData.detail ||
            menuData.error ||
            menuData.detail ||
            tablesData.error ||
            tablesData.detail ||
            "Unable to load menu."
          );
        }

        const safeCategories = categoryData.items || [];
        const safeTables = tablesData.tables || [];
        const requestedTable = safeTables.find((table) => table.id === Number(tableId));

        setCategories(safeCategories);
        setTables(safeTables);
        setCustomer((current) => ({
          ...current,
          table_number: current.table_number || String(requestedTable?.table_number || ""),
        }));
        setItems(normalizeMenuItems(menuData.menuItems, safeCategories));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load menu.");
      } finally {
        setLoading(false);
      }
    }

    loadMenu();
  }, [tableId]);

  const categoryOptions = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set([
          ...categories
            .filter((entry) => entry.is_available !== false)
            .map((entry) => entry.name)
            .filter((c): c is string => typeof c === "string" && c.trim() !== ""),
          ...items
            .map((item) => item.category)
            .filter((c): c is string => typeof c === "string" && c.trim() !== ""),
        ])
      ),
    ],
    [categories, items]
  );
  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemCategory = getMenuCategory(item);
        const price = Number(item.price || 0);

        if (item.is_available === false) return false;
        if (!Number.isFinite(price) || price < 0) return false;
        if (category !== "All" && itemCategory !== category) return false;
        if (!search.trim()) return true;

        const haystack = `${item.name} ${item.description} ${itemCategory}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      }),
    [category, items, search]
  );

  const visibleGroups = useMemo<MenuGroup[]>(() => {

    const sourceCategories = category === "All" ? categoryOptions.filter((entry) => entry !== "All") : [category];

    return sourceCategories
      .map((groupCategory) => ({
        category: groupCategory,
        items: filteredItems.filter((item) => getMenuCategory(item) === groupCategory),
      }))
      .filter((group) => group.items.length > 0);
  }, [category, categoryOptions, filteredItems]);

  const cartQuantities = useMemo(
    () => new Map(cart.map((item) => [item.id, Math.max(1, Number(item.quantity || 1))])),
    [cart]
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0),
    [cart]
  );
  const cartSubtotal = useMemo(() => Math.max(0, calcSubtotal(cart)), [cart]);

  const addToCart = useCallback(
    (menuItem: MenuItem): void => {
      setCart((current) => {
        const price = Math.max(0, Number(menuItem.price || 0));
        const existing = current.find((item) => item.id === menuItem.id);

        if (existing) {
          return current.map((item) =>
            item.id === menuItem.id
              ? { ...item, quantity: Math.max(1, Number(item.quantity || 0)) + 1 }
              : item
          );
        }

        return [
          ...current,
          {
            id: menuItem.id,
            name: menuItem.name,
            price,
            image_url: menuItem.image_url,
            category: getMenuCategory(menuItem),
            quantity: 1,
            table_id: Number(tableId) || 1,
          },
        ];
      });
    },
    [tableId]
  );

  const changeQuantity = useCallback((id: number, delta: number): void => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, Number(item.quantity || 0) + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const handleIncrement = useCallback(
    (id: number): void => {
      changeQuantity(id, 1);
    },
    [changeQuantity]
  );

  const handleDecrement = useCallback(
    (id: number): void => {
      changeQuantity(id, -1);
    },
    [changeQuantity]
  );

  const handleRemove = useCallback((id: number): void => {
    setCart((current) => current.filter((item) => item.id !== id));
  }, []);

  const openCustomerModal = useCallback((): void => {
    setOrderError("");
    setOrderSuccess("");
    setIsCustomerModalOpen(true);
  }, []);

  const closeCustomerModal = useCallback((): void => {
    if (placingOrder) return;
    setIsCustomerModalOpen(false);
  }, [placingOrder]);

  const placeOrder = useCallback(
    async (): Promise<void> => {
      setOrderError("");
      setOrderSuccess("");
      const customerName = customer.customer_name.trim();
      const customerMobile = customer.customer_mobile.trim();
      const tableNumber = Number(customer.table_number);

      const validCart = cart.filter(
        (item) =>
          Number.isFinite(Number(item.id)) &&
          Number(item.quantity) > 0 &&
          Number.isFinite(Number(item.price)) &&
          Number(item.price) >= 0
      );

      if (validCart.length === 0) {
        setOrderError("Add at least one item before placing the order.");
        return;
      }
if (!customerName || !customerMobile) {
  setOrderError("Customer name and mobile number are required.");
  return;
}

if (customer.order_type === "Dine-In" && !tableNumber) {
  setOrderError("Table number is required for Dine-In orders.");
  return;
}
      if (customerMobile.length !== 10) {
        setOrderError("Mobile number must be exactly 10 digits.");
        return;
      }

      setPlacingOrder(true);

      try {
        const response = await tenantApiFetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: Number(tableId || validCart[0]?.table_id || 1),
            table_number: tableNumber,
            customer_name: customerName,
            customer_mobile: customerMobile,
            order_type: customer.order_type,
            items: validCart.map((item) => ({
              menu_item_id: item.id,
              quantity: item.quantity,
            })),
          }),
        });

        const data = (await response.json()) as { order?: { order_id?: string; id?: number }; error?: string; detail?: string };

        if (!response.ok) {
          throw new Error(data.error || data.detail || "Unable to place order.");
        }

        setCart([]);
        setIsCustomerModalOpen(false);
        setOrderSuccess(`Order placed successfully${data.order?.order_id ? `: ${data.order.order_id}` : ""}.`);
      } catch (placeOrderError) {
        setOrderError(placeOrderError instanceof Error ? placeOrderError.message : "Unable to place order.");
      } finally {
        setPlacingOrder(false);
      }
    },
    [cart, customer, tableId]
  );

  return (
    <div className="grid gap-6 pb-20 xl:grid-cols-[minmax(0,1fr)_360px] xl:pb-0">
      <section className="min-w-0 space-y-5">
        <div className="glass-panel rounded-lg p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Customer Order
            </h2>

            <div className="w-full xl:w-[420px]">
              <MenuSearchBar value={search} onChange={setSearch} />
            </div>
          </div>
        </div>

        <CategoryChips categories={categoryOptions} active={category} onChange={setCategory} />

        {orderSuccess ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-slate-900">
            {orderSuccess}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Loading menu...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">
            {error}
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No menu items found.
          </div>
        ) : (
          <div className="space-y-7">
            {visibleGroups.map((group) => (
              <CategorySection
                key={group.category}
                category={group.category}
                items={group.items}
                cartQuantities={cartQuantities}
                onAdd={addToCart}
                onChangeQuantity={changeQuantity}
              />
            ))}
          </div>
        )}
      </section>

      <CurrentCart
        cart={cart}
        totalItems={totalItems}
        grandTotal={cartSubtotal}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemove}
        onPlaceOrder={openCustomerModal}
        placingOrder={placingOrder}
      />

      <CustomerDetailsModal
        open={isCustomerModalOpen}
        placingOrder={placingOrder}
        error={orderError}
        customer={customer}
        tables={tables}
        onCustomerChange={setCustomer}
        onClose={closeCustomerModal}
        onConfirm={placeOrder}
      />

      <StickyCartBar href="/cart" itemCount={totalItems} total={cartSubtotal} />
    </div>
  );
}
