"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Search, Send, ShoppingCart, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { calcSubtotal } from "@/lib/order-math";
import type { CartItem as CartEntry, Category, MenuItem, OrderMode } from "@/types/cafe";

const CART_KEY = "smart-cafe-cart";
const CUSTOMER_KEY = "smart-cafe-customer";
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
  order_type: OrderMode;
}

interface CustomerDetailsModalProps {
  open: boolean;
  placingOrder: boolean;
  error: string;
  customer: CustomerForm;
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
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-crema/45"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search menu"
        className="h-12 w-full rounded-lg border border-white/10 bg-black/15 pl-11 pr-4 text-sm text-crema outline-none transition placeholder:text-crema/40 focus:border-saffron/60 focus:bg-black/20"
      />
    </label>
  );
}

function CategoryChips({ categories, active, onChange }: CategoryChipsProps) {
  const safeCategories = categories.filter((c): c is string => typeof c === "string");

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {safeCategories.map((category) => {
        const isActive = category === active;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`shrink-0 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "border-saffron bg-saffron text-espresso"
                : "border-white/10 bg-white/8 text-crema/70 hover:bg-white/12 hover:text-crema"
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
    <div className="grid h-10 w-full grid-cols-[40px_1fr_40px] items-center rounded-lg border border-white/10 bg-black/15 p-0.5">
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-crema transition hover:bg-white/15"
        onClick={onDecrease}
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="text-center text-sm font-semibold text-crema">{Math.max(1, quantity)}</span>
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-crema transition hover:bg-white/15"
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
    <article className="flex h-[444px] flex-col overflow-hidden rounded-lg border border-white/10 bg-white/8 transition hover:-translate-y-0.5 hover:bg-white/12">
      <div className="h-44 shrink-0 overflow-hidden bg-white/6">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-crema/45">No image</div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="grid min-h-[76px] grid-cols-[1fr_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase text-saffron">
              {getMenuCategory(item)}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-crema">
              {item.name}
            </h3>
          </div>
          <p className="shrink-0 font-semibold text-crema">{formatCurrency(price)}</p>
        </div>
        <p className="mt-3 h-24 overflow-hidden text-sm leading-6 text-crema/62">
          {item.description || "Freshly prepared cafe favorite."}
        </p>
        <div className="mt-auto h-10">
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
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-saffron px-4 text-sm font-semibold text-espresso transition hover:bg-[#efb150]"
            >
              Add to Cart
            </button>
          )}
        </div>
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-crema">{category}</h3>
        <span className="shrink-0 text-sm text-crema/50">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2 2xl:grid-cols-3">
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
    <div className="grid grid-cols-[58px_1fr] gap-3 rounded-lg border border-white/10 bg-white/8 p-3">
      <div className="h-14 w-14 overflow-hidden rounded-lg bg-white/8">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-white/6" />
        )}
      </div>
<div className="min-w-0 flex-1">
  {/* Name + Total */}
  <div className="flex items-start justify-between gap-2 mb-1.5">
    <p className="line-clamp-2 text-sm font-medium leading-5 text-crema">
      {item.name}
    </p>
    <span className="shrink-0 text-[15px] font-semibold text-crema">
      {formatCurrency(itemTotal)}
    </span>
  </div>

  {/* Qty controls + Remove */}
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-crema/50">{formatCurrency(item.price)} each</span>
      <span className="w-[3px] h-[3px] rounded-full bg-crema/20" />

      {/* Quantity stepper */}
      <div className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2 py-1">
        <button
          type="button"
          onClick={() => onDecrement(item.id)}
          className="text-crema/50 hover:text-crema transition"
          aria-label="Decrease quantity"
        >
          <Minus size={11} />
        </button>
        <span className="min-w-[14px] text-center text-[13px] font-medium text-crema">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onIncrement(item.id)}
          className="text-crema/50 hover:text-crema transition"
          aria-label="Increase quantity"
        >
          <Plus size={11} />
        </button>
      </div>
    </div>

    {/* Remove button */}
    <button
      type="button"
      onClick={() => onRemove(item.id)}
      className="flex items-center gap-1 rounded-lg border border-berry/25 bg-berry/10 px-2.5 py-1 text-xs font-medium text-berry transition hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400"
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
    <div className="border-t border-white/10 pt-4">
      <div className="flex items-center justify-between text-sm text-crema/68">
        <span>Total items</span>
        <span className="font-semibold text-crema">{totalItems}</span>
      </div>
      <div className="mt-3 flex items-center justify-between text-lg font-semibold text-crema">
        <span>Grand total</span>
        <span>{formatCurrency(Number.isFinite(grandTotal) ? grandTotal : 0)}</span>
      </div>
      <button
        type="button"
        disabled={isEmpty || placingOrder}
        onClick={onPlaceOrder}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso transition hover:bg-[#efb150] disabled:cursor-not-allowed disabled:opacity-60"
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
    <aside className="glass-panel sticky top-6 flex max-h-[calc(100vh-3rem)] min-h-[420px] flex-col rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-crema">Current Cart</h3>
        <span className="rounded-lg border border-white/10 bg-white/8 px-3 py-1 text-sm font-semibold text-crema">
          {totalItems}
        </span>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/8 p-5 text-center">
            <ShoppingCart className="mx-auto text-saffron" size={30} aria-hidden="true" />
            <p className="mt-3 font-medium text-crema">Your cart is empty.</p>
            <p className="mt-1 text-sm leading-6 text-crema/58">Add items from the menu to start an order.</p>
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
  onCustomerChange,
  onClose,
  onConfirm,
}: CustomerDetailsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <div className="w-full max-w-sm rounded-lg border border-white/10 bg-[#2d211c] p-5 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-crema">Customer Details</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={placingOrder}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema/70 transition hover:text-crema disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close payment options"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-berry/20 p-3 text-sm text-crema">{error}</p>
        ) : null}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-crema/70">Customer Name</span>
            <input
              value={customer.customer_name}
              onChange={(event) =>
                onCustomerChange({ ...customer, customer_name: event.target.value })
              }
              disabled={placingOrder}
              className="h-12 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm text-crema outline-none transition placeholder:text-crema/40 focus:border-saffron/60 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Enter customer name"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-crema/70">
              Customer Mobile Number
            </span>
            <input
              value={customer.customer_mobile}
              onChange={(event) =>
                onCustomerChange({ ...customer, customer_mobile: event.target.value })
              }
              disabled={placingOrder}
              inputMode="tel"
              className="h-12 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm text-crema outline-none transition placeholder:text-crema/40 focus:border-saffron/60 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Enter mobile number"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-crema/70">Order Type</span>
            <select
              value={customer.order_type}
              onChange={(event) =>
                onCustomerChange({ ...customer, order_type: event.target.value as OrderMode })
              }
              disabled={placingOrder}
              className="h-12 w-full rounded-lg border border-white/10 bg-black/15 px-3 text-sm text-crema outline-none transition focus:border-saffron/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option className="bg-[#2d211c] text-crema" value="Dine-In">
                Dine-in
              </option>
              <option className="bg-[#2d211c] text-crema" value="Takeaway">
                Takeaway
              </option>
            </select>
          </label>

          <button
            type="button"
            onClick={onConfirm}
            disabled={placingOrder}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso transition hover:bg-[#efb150] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={18} aria-hidden="true" />
            {placingOrder ? "Confirming..." : "Confirm Order"}
          </button>
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
      className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso shadow-2xl shadow-black/35 xl:hidden"
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
    order_type: "Dine-In",
  });

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setError("");

      try {
        const [categoryResponse, menuResponse] = await Promise.all([
          fetch("/api/admin/category"),
          fetch("/api/admin/menu_master"),
        ]);
        const categoryData = (await categoryResponse.json()) as CategoriesResponse;
        const menuData = (await menuResponse.json()) as MenuMasterResponse;

        if (!categoryResponse.ok || !menuResponse.ok) {
          throw new Error(
            categoryData.error || categoryData.detail || menuData.error || menuData.detail || "Unable to load menu."
          );
        }

        const safeCategories = categoryData.items || [];

        setCategories(safeCategories);
        setItems(normalizeMenuItems(menuData.menuItems, safeCategories));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load menu.");
      } finally {
        setLoading(false);
      }
    }

    const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as CartEntry[];
    const savedCustomer = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "{}") as Partial<CustomerForm>;

    setCart(savedCart.filter((item) => Number(item.quantity) > 0 && Number(item.price) >= 0));
    setCustomer({
      customer_name: savedCustomer.customer_name || "",
      customer_mobile: savedCustomer.customer_mobile || "",
      order_type: savedCustomer.order_type === "Takeaway" ? "Takeaway" : "Dine-In",
    });
    loadMenu();
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

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
    const sourceCategories =
      category === "All"
        ? categoryOptions.filter((entry) => entry !== "All")
        : [category];

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

      setPlacingOrder(true);

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: Number(tableId || validCart[0]?.table_id || 1),
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

        localStorage.setItem(
          CUSTOMER_KEY,
          JSON.stringify({
            customer_name: customerName,
            customer_mobile: customerMobile,
            order_type: customer.order_type,
          })
        );
        setCart([]);
        localStorage.removeItem(CART_KEY);
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
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Customer Order</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
             <MenuSearchBar value={search} onChange={setSearch} /> 
          </div>
        </div>

        <CategoryChips categories={categoryOptions} active={category} onChange={setCategory} />

        {orderSuccess ? (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/15 p-4 text-sm font-medium text-crema">
            {orderSuccess}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
            Loading menu...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-berry/30 bg-berry/20 p-8 text-center text-crema">
            {error}
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
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
        onCustomerChange={setCustomer}
        onClose={closeCustomerModal}
        onConfirm={placeOrder}
      />

      <StickyCartBar href="/cart" itemCount={totalItems} total={cartSubtotal} />
    </div>
  );
}
