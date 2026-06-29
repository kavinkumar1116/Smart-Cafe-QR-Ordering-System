"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  ShoppingBag,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  UserRound,
  LayoutGrid,
  X,
  Phone,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { calcSubtotal, calcTax, calcGrandTotal, getGstRate } from "@/lib/order-math";
import { tenantApiFetch } from "@/lib/tenant";
import type { CafeTable, CartItem as CartEntry, Category, MenuItem, OrderMode } from "@/types/cafe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCafeStore } from "@/src/store/useCafeStore";

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

/* ── Interfaces ──────────────────────────────────── */

interface CategoriesResponse { items?: Category[]; error?: string; detail?: string; }
interface MenuMasterResponse { menuItems?: MenuItem[]; error?: string; detail?: string; }
interface TablesResponse { tables?: CafeTable[]; error?: string; detail?: string; }

interface CustomerForm {
  customer_name: string;
  customer_mobile: string;
  table_number: string;
  order_type: OrderMode;
}

interface MenuSearchBarProps { value: string; onChange: (value: string) => void; }
interface CategoryNavProps { categories: string[]; active: string; onChange: (category: string) => void; }
interface ProductCardProps { item: MenuItem; quantity: number; onAdd: (item: MenuItem) => void; onChangeQuantity: (id: number, delta: number) => void; }
interface CategorySectionProps { category: string; items: MenuItem[]; cartQuantities: Map<number, number>; onAdd: (item: MenuItem) => void; onChangeQuantity: (id: number, delta: number) => void; }
interface CartItemRowProps { item: CartEntry; onIncrement: (id: number) => void; onDecrement: (id: number) => void; onRemove: (id: number) => void; }
interface CurrentCartProps {
  cart: CartEntry[];
  totalItems: number;
  grandTotal: number;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
  placingOrder: boolean;
  orderError: string;
  customer: CustomerForm;
  tables: CafeTable[];
  onCustomerChange: (customer: CustomerForm) => void;
  onClose: () => void;
}
interface StickyCartBarProps { href: string; itemCount: number; total: number; }
interface MenuGroup { category: string; items: MenuItem[]; }
interface MenuExperienceProps { tableId?: string; }

/* ── Search Bar ──────────────────────────────────── */

function MenuSearchBar({ value, onChange }: MenuSearchBarProps) {
  return (
    <label className="relative block">
      <span className="sr-only">Search menu</span>
      <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search items..."
        className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
      />
    </label>
  );
}

/* ── Category Nav (horizontal scroll + arrows) ───── */

function CategoryNav({ categories, active, onChange }: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const safeCategories = categories.filter((c): c is string => typeof c === "string");

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -160 : 160, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-1 bg-white border-b border-slate-200 px-2">
      <button
        type="button"
        onClick={() => scroll("left")}
        className="flex h-8 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        aria-label="Scroll categories left"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex flex-1 items-center gap-0 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {safeCategories.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={`shrink-0 px-4 py-3 text-[13px] font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        className="flex h-8 w-7 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        aria-label="Scroll categories right"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── Product Card ────────────────────────────────── */

const ProductCard = memo(function ProductCard({ item, quantity, onAdd, onChangeQuantity }: ProductCardProps) {
  const price = Number(item.price || 0);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition cursor-pointer">
      {/* Image */}
      <div className="relative overflow-hidden bg-slate-100" style={{ paddingBottom: "72%" }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <LayoutGrid size={28} className="text-slate-300" />
          </div>
        )}
        {quantity > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow">
            {quantity}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-0.5">
        <h3 className="text-[13px] font-semibold text-slate-800 leading-tight line-clamp-2">{item.name}</h3>
      </div>

      {/* Price button / qty stepper */}
      <div className="px-2 pb-2 pt-1.5 mt-auto">
        {quantity > 0 ? (
          <div className="flex items-center justify-between rounded overflow-hidden border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => onChangeQuantity(item.id, -1)}
              className="flex h-7 w-8 items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              aria-label="Decrease"
            >
              <Minus size={12} />
            </button>
            <span className="text-[13px] font-bold text-slate-800 select-none">{quantity}</span>
            <button
              type="button"
              onClick={() => onChangeQuantity(item.id, 1)}
              className="flex h-7 w-8 items-center justify-center text-slate-500 hover:bg-slate-200 transition"
              aria-label="Increase"
            >
              <Plus size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(item)}
            className="w-full rounded bg-[#20be5a] hover:bg-[#263660] active:bg-[#162240] text-white text-[13px] font-semibold py-1.5 transition"
          >
            {formatCurrency(price)}
          </button>
        )}
      </div>
    </article>
  );
});

/* ── Category Section ────────────────────────────── */

const CategorySection = memo(function CategorySection({
  category, items, cartQuantities, onAdd, onChangeQuantity,
}: CategorySectionProps) {
  return (
    <section>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
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

/* ── Cart Item Row ───────────────────────────────── */

function CartItemRow({ item, onIncrement, onDecrement, onRemove }: CartItemRowProps) {
  const itemTotal = Number(item.price || 0) * Math.max(0, Number(item.quantity || 0));

  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-slate-100 last:border-b-0">
      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 leading-snug truncate">{item.name}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={() => onDecrement(item.id)}
          className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-800 transition"
          aria-label="Decrease"
        >
          <Minus size={11} />
        </button>
        <span className="min-w-[28px] text-center text-[13px] font-bold text-slate-800 select-none border border-slate-200 rounded h-6 flex items-center justify-center">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onIncrement(item.id)}
          className="flex h-6 w-6 items-center justify-center text-slate-500 hover:text-slate-800 transition"
          aria-label="Increase"
        >
          <Plus size={11} />
        </button>
      </div>

      {/* Total + remove */}
      <div className="flex items-center gap-1.5 shrink-0 min-w-[72px] justify-end">
        <span className="text-[13px] font-semibold text-slate-800">{formatCurrency(itemTotal)}</span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-slate-300 hover:text-rose-500 transition"
          aria-label="Remove"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Current Cart (fixed right panel) ───────────── */

function CurrentCart({
  cart, totalItems, grandTotal,
  onIncrement, onDecrement, onRemove,
  onCheckout, placingOrder, orderError,
  customer, tables, onCustomerChange,
  onClose,
}: CurrentCartProps) {
  const subscriptionStatus = useCafeStore((state) => state.subscriptionStatus);
  const discount = 0;
  const isDineIn = customer.order_type === "Dine-In";
  const isExpired = subscriptionStatus === "Expired";

  const gstRate = getGstRate();
  const tax = calcTax(grandTotal, gstRate);
  const finalTotal = calcGrandTotal(grandTotal, tax) - discount;

  return (
    <aside className="w-full h-full flex flex-col bg-[#FDFCFB] p-6 md:p-8 overflow-y-auto relative">
      {/* Circular Close (X) button inside the top-right corner */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm z-10"
        aria-label="Close cart"
      >
        <X size={18} />
      </button>

      {/* Top row premium cards */}
      <div className="
group
relative
flex
items-center
gap-4
rounded-3xl
border
bg-white
px-5
py-4
shadow-sm
transition-all
duration-200
hover:shadow-lg
">
        
        {/* Order Type */}
        <Select
          value={customer.order_type}
          onValueChange={(value: OrderMode) =>
            onCustomerChange({
              ...customer,
              order_type: value,
              table_number: value === "Takeaway" ? "" : customer.table_number,
            })
          }
          disabled={placingOrder}
        >
          <SelectTrigger className="flex items-center gap-3 bg-[#FAF3EE] border border-[#EFE1D5] rounded-2xl p-3 !w-full !h-auto text-left hover:bg-[#FAF3EE]/80 transition shadow-xs focus:ring-0 focus:ring-offset-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-[#8B5E3C]">
              {customer.order_type === "Dine-In" ? <UtensilsCrossed size={18} /> : <ShoppingBag size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-800/60 leading-none">ORDER TYPE</span>
              <span className="block text-[13px] font-bold text-slate-800 mt-1 truncate">
                <SelectValue placeholder="Order Type" />
              </span>
            </div>
          </SelectTrigger>
          <SelectContent position="popper" className="bg-white border-slate-200 shadow-xl w-[var(--radix-select-trigger-width)]">
            <SelectItem value="Dine-In">Dine-In</SelectItem>
            <SelectItem value="Takeaway">Takeaway</SelectItem>
          </SelectContent>
        </Select>

        {/* Table Number */}
        {isDineIn ? (
          <Select
            value={customer.table_number}
            onValueChange={(value) => onCustomerChange({ ...customer, table_number: value })}
            disabled={placingOrder}
          >
            <SelectTrigger className="flex items-center gap-3 bg-[#F2F8F4] border border-[#E2EFE6] rounded-2xl p-3 !w-full !h-auto text-left hover:bg-[#F2F8F4]/80 transition shadow-xs focus:ring-0 focus:ring-offset-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs text-[#2E7D32]">
                <UtensilsCrossed size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/60 leading-none">TABLE NO.</span>
                <span className="block text-[13px] font-bold text-slate-800 mt-1 truncate">
                  <SelectValue placeholder="Select Table" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent position="popper" className="bg-white border-slate-200 shadow-xl w-[var(--radix-select-trigger-width)]">
              {tables.map((table) => (
                <SelectItem key={table.id} value={String(table.table_number)}>
                  Table {table.table_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-3 bg-slate-100/50 border border-slate-200/60 rounded-2xl p-3 h-full opacity-60">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs text-slate-400">
              <UtensilsCrossed size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-none">TABLE NO.</span>
              <span className="block text-[13px] font-bold text-slate-400 mt-1 truncate">
                N/A (Takeaway)
              </span>
            </div>
          </div>
        )}

        {/* Customer Name */}
        <div className="flex items-center gap-3 bg-[#FAF3EE] border border-[#EFE1D5] rounded-2xl p-3 !w-full !h-auto text-left hover:bg-[#FAF3EE]/80 transition shadow-xs focus:ring-0 focus:ring-offset-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs text-[#1565C0]">
            <UserRound size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-800/60 leading-none">CUSTOMER NAME</label>
            <input
              value={customer.customer_name}
              onChange={(e) => onCustomerChange({ ...customer, customer_name: e.target.value })}
              disabled={placingOrder}
              placeholder="Enter name"
              className="block w-full bg-transparent border-none p-0 text-[13px] font-bold text-slate-800 placeholder:text-slate-400/80 outline-none focus:ring-0 mt-1 leading-tight"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div className="flex items-center gap-3 bg-[#FAF3EE] border border-[#EFE1D5] rounded-2xl p-3 !w-full !h-auto text-left hover:bg-[#FAF3EE]/80 transition shadow-xs focus:ring-0 focus:ring-offset-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs text-[#7B1FA2]">
            <Phone size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-800/60 leading-none">MOBILE NUMBER</label>
            <input
              type="tel"
              inputMode="numeric"
              minLength={10}
              maxLength={10}
              value={customer.customer_mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                onCustomerChange({ ...customer, customer_mobile: value });
              }}
              disabled={placingOrder}
              placeholder="10-digit mobile *"
              className="block w-full bg-transparent border-none p-0 text-[13px] font-bold text-slate-800 placeholder:text-slate-400/80 outline-none focus:ring-0 mt-1 leading-tight"
            />
          </div>
        </div>

      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Ordered Items */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[300px] lg:min-h-0 bg-white border border-slate-100 rounded-3xl shadow-xs p-6">
          <h3 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Ordered Items</h3>
          
          <div className="flex-1 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <ShoppingCart size={44} className="text-slate-200 mb-3" />
                <p className="text-[14px] font-semibold text-slate-400">Your cart is empty</p>
                <p className="text-[12px] text-slate-300 mt-1">Select items from the menu to build order</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-2">
                    <th className="pb-3 font-extrabold">Item</th>
                    <th className="pb-3 text-right font-extrabold">Price</th>
                    <th className="pb-3 text-center font-extrabold">Qty</th>
                    <th className="pb-3 text-right font-extrabold">Total</th>
                    <th className="pb-3 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item) => {
                    const itemTotal = Number(item.price || 0) * Math.max(0, Number(item.quantity || 0));
                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-12 w-12 rounded-xl object-cover shadow-xs bg-slate-50 shrink-0"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                <LayoutGrid size={20} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block font-bold text-slate-800 text-[13px] leading-tight truncate">
                                {item.name}
                              </span>
                              {(item as any).variant && (
                                <span className="block text-[11px] text-amber-800/70 font-semibold mt-0.5">
                                  • {(item as any).variant}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-600 text-[13px] whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center border border-slate-200 bg-slate-50/50 rounded-xl p-0.5">
                            <button
                              type="button"
                              onClick={() => onDecrement(item.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                              aria-label="Decrease"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="w-8 text-center text-[12px] font-bold text-slate-800 select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onIncrement(item.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                              aria-label="Increase"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-800 text-[13px] whitespace-nowrap">
                          {formatCurrency(itemTotal)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            className="text-slate-300 hover:text-[#E05C5C] p-1 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          
          {/* Summary Card */}
          <div className="bg-white border border-slate-100 rounded-3xl shadow-xs p-6 space-y-4">
            <h3 className="text-[12px] font-extrabold text-slate-400 uppercase tracking-widest">Order Summary</h3>
            
            <div className="space-y-2.5">
              <div className="flex justify-between text-[13px] text-slate-500">
                <span>Total Items</span>
                <span className="font-bold text-slate-800">{totalItems}</span>
              </div>
              <div className="flex justify-between text-[13px] text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">{formatCurrency(grandTotal)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-slate-500">
                <span>Discount</span>
                <span className="font-bold text-emerald-600">- {formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-slate-500">
                <span>Tax ({Math.round(gstRate * 100)}%)</span>
                <span className="font-bold text-slate-800">{formatCurrency(tax)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-3" />

            <div className="flex justify-between items-baseline">
              <span className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wider">Total Amount</span>
              <span className="text-[24px] font-black text-slate-900 leading-none tracking-tight">
                {formatCurrency(Number.isFinite(finalTotal) ? finalTotal : 0)}
              </span>
            </div>
          </div>

          {/* Action button & Error banner */}
          <div className="space-y-4">
            {orderError && (
              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-[12px] text-red-700 leading-snug flex items-start gap-2 shadow-xs">
                <TriangleAlert size={16} className="shrink-0 text-red-500 mt-0.5" />
                <span>{orderError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onCheckout}
              disabled={isExpired || cart.length === 0 || placingOrder}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 active:scale-98 ${
                isExpired ? "bg-rose-600 hover:bg-rose-700 shadow-rose-950/10" : "bg-[#20be5a] hover:bg-[#066c06] shadow-amber-950/15"
              }`}
            >
              {isExpired ? (
                <><TriangleAlert size={16} /> Upgrade Now</>
              ) : (
                <>
                  {placingOrder ? "Confirming..." : "Proceed to kitchen"}
                  {!placingOrder && <ChevronRight size={16} />}
                </>
              )}
            </button>
        </div>

      </div>

    </div>

  </aside>
);
}

/* ── Sticky Mobile Cart Bar ──────────────────────── */

function StickyCartBar({ href, itemCount, total }: StickyCartBarProps) {
  if (itemCount === 0) return null;
  return (
    <Link
      href={href}
      className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-[#20be5a] px-4 py-3 font-semibold text-white shadow-xl xl:hidden"
    >
      <span className="inline-flex items-center gap-2">
        <ShoppingCart size={17} aria-hidden="true" />
        {itemCount} item{itemCount === 1 ? "" : "s"}
      </span>
      <span className="text-sm">{formatCurrency(total)}</span>
    </Link>
  );
}

/* ── Main Order Page ─────────────────────────────── */

export default function Order({ tableId }: MenuExperienceProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [category, setCategory] = useState("");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [customer, setCustomer] = useState<CustomerForm>({
    customer_name: "",
    customer_mobile: "",
    table_number: "",
    order_type: "Dine-In",
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

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
            categoryData.error || categoryData.detail ||
            menuData.error || menuData.detail ||
            tablesData.error || tablesData.detail ||
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

  useEffect(() => {
    if (categoryOptions.length > 0 && !categoryOptions.includes(category)) {
      setCategory(categoryOptions[0]);
    }
  }, [categoryOptions]);

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const itemCategory = getMenuCategory(item);
        const price = Number(item.price || 0);
        if (item.is_available === false) return false;
        if (!Number.isFinite(price) || price < 0) return false;
        if (itemCategory !== category) return false;
        if (!search.trim()) return true;
        const haystack = `${item.name} ${item.description} ${itemCategory}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      }),
    [category, items, search]
  );

  const visibleGroups = useMemo<MenuGroup[]>(() => {
    return [{ category, items: filteredItems }].filter((group) => group.items.length > 0);
  }, [category, filteredItems]);

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

  const handleIncrement = useCallback((id: number): void => { changeQuantity(id, 1); }, [changeQuantity]);
  const handleDecrement = useCallback((id: number): void => { changeQuantity(id, -1); }, [changeQuantity]);
  const handleRemove = useCallback((id: number): void => {
    setCart((current) => current.filter((item) => item.id !== id));
  }, []);

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

      if (validCart.length === 0) { setOrderError("Add at least one item before placing the order."); return; }
      if (!customerName || !customerMobile) { setOrderError("Customer name and mobile number are required."); return; }
      if (customer.order_type === "Dine-In" && !tableNumber) { setOrderError("Table number is required for Dine-In orders."); return; }
      if (customerMobile.length !== 10) { setOrderError("Mobile number must be exactly 10 digits."); return; }

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
        if (!response.ok) throw new Error(data.error || data.detail || "Unable to place order.");

        setCart([]);
        setOrderSuccess(`Order placed successfully${data.order?.order_id ? `: ${data.order.order_id}` : ""}.`);
        setIsCartOpen(false);
      } catch (placeOrderError) {
        setOrderError(placeOrderError instanceof Error ? placeOrderError.message : "Unable to place order.");
      } finally {
        setPlacingOrder(false);
      }
    },
    [cart, customer, tableId]
  );

  return (
    /* Full-screen POS layout: left menu + right cart panel */
    <div className="relative flex h-screen overflow-hidden bg-slate-100">

      {/* ── Left: scrollable menu area ─────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Top bar: title + search */}
        <div className="flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-2.5 shrink-0">
          <h2 className="text-[15px] font-bold text-slate-800 whitespace-nowrap">Customer Order</h2>
          <div className="flex-1 max-w-xs ml-auto">
            <MenuSearchBar value={search} onChange={setSearch} />
          </div>
        </div>

        {/* Category nav */}
        <div className="bg-white shrink-0 shadow-sm">
          <CategoryNav categories={categoryOptions} active={category} onChange={setCategory} />
        </div>

        {/* Success toast */}
        {orderSuccess && (
          <div className="mx-4 mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-800 shrink-0">
            {orderSuccess}
          </div>
        )}

        {/* Menu items — scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-[13px] text-slate-400">
              Loading menu...
            </div>
          ) : error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-center text-[13px] text-rose-700">
              {error}
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-[13px] text-slate-400">
              No items found.
            </div>
          ) : (
            <div className="space-y-5">
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
        </div>
      </div>

      {/* ── Overlay ── */}
      <div
        className={`fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* ── Right: drawer ─────────────── */}
      <div
        className={`fixed top-0 right-0 h-screen w-full sm:w-[90vw] md:w-[80vw] lg:w-[65vw] xl:w-[65vw] bg-[#FDFBF7] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <CurrentCart
          cart={cart}
          totalItems={totalItems}
          grandTotal={cartSubtotal}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
          onCheckout={placeOrder}
          placingOrder={placingOrder}
          orderError={orderError}
          customer={customer}
          tables={tables}
          onCustomerChange={setCustomer}
          onClose={() => setIsCartOpen(false)}
        />
      </div>

      {/* ── Floating Confirm Order Button ── */}
      {cart.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-3 bg-[#20be5a] text-white px-6 py-4 rounded-2xl shadow-xl shadow-amber-950/20 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <div className="relative text-black">
            <ShoppingCart size={20} />
            <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-950 shadow">
              {totalItems}
            </span>
          </div>
          <div className="flex flex-col items-start leading-none text-left">
            <span className="text-[10px] text-black uppercase tracking-wider font-bold opacity-75">Confirm Order</span>
            <span className="text-[15px] text-black font-extrabold mt-0.5">{formatCurrency(cartSubtotal)}</span>
          </div>
        </button>
      )}

    </div>
  );
}