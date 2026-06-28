"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import {
  getCategoryNameById,
  getTenantDisplayName,
  isQrMenuResponse,
  QR_MENU_PLACEHOLDER_IMAGE,
} from "@/lib/qr-menu";
import type {
  QrCartItem,
  QrMenuItem,
  QrMenuResponse,
  QrRestaurantDetails,
} from "@/types/qr-menu";
import { Button } from "../ui/Button";
import type { OrderMode } from "@/types/cafe";

type MenuStatus = "loading" | "ready" | "empty" | "error" | "table-not-found";

interface CustomerForm {
  table_number: string;
  customer_name: string;
  customer_mobile: string;
  order_type: OrderMode;
}

interface OrderApiResponse {
  order?: {
    id?: number | string;
    order_id?: string;
  };
  error?: string;
  detail?: string;
}

interface QrMenuExperienceProps {
  tenantSlug: string;
  tableNo: string;
  restaurantDetails?: {
    name: string;
    logo: string;
  };
}

function SkeletonCard() {
  return (
    <div className="min-h-[20rem] sm:min-h-[27rem] overflow-hidden rounded-2xl border border-white bg-white p-2 sm:p-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="h-32 sm:h-52 animate-pulse rounded-xl bg-slate-100" />
      <div className="space-y-3 p-2 pt-3 sm:pt-5">
        <div className="h-4 sm:h-5 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 sm:h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 sm:h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between pt-6 sm:pt-16">
          <div className="h-6 sm:h-8 w-16 sm:w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="h-10 sm:h-12 w-full sm:w-32 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function StatusPanel({
  title,
  message,
  showBack,
}: {
  title: string;
  message: string;
  showBack?: boolean;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f8fafc_32%,#ecfdf5_100%)] p-5 text-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-white bg-white/80 p-8 text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">{message}</p>
        {showBack ? (
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-6 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-emerald-700"
          >
            Back
          </button>
        ) : null}
      </div>
    </main>
  );
}

function MenuCard({
  item,
  categoryName,
  quantity,
  onAdd,
  onDecrease,
  onIncrease,
}: {
  item: QrMenuItem;
  categoryName: string;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const imageUrl = item.image_url || QR_MENU_PLACEHOLDER_IMAGE;

  return (
    <article className="group flex h-full min-h-[20rem] sm:min-h-[27rem] flex-col overflow-hidden rounded-2xl border border-white bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
      <div className="relative m-2 sm:m-3 h-32 sm:h-52 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 bg-gradient-to-t from-slate-950/60 to-transparent" />
        <div className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full bg-white/90 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-black text-emerald-700 shadow-sm backdrop-blur">
          {categoryName}
        </div>
        {item.is_available ? null : (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/55 px-2 sm:px-4 text-center text-xs sm:text-sm font-black text-white backdrop-blur-[1px]">
            Unavailable
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5 pt-2">
        <h2 className="line-clamp-1 text-base sm:text-xl font-black text-slate-950">{item.name}</h2>
        <p className="mt-1 line-clamp-2 min-h-8 sm:min-h-10 text-xs sm:text-sm font-medium leading-4 sm:leading-5 text-slate-500">
          {item.description || "Freshly prepared by the kitchen."}
        </p>

        <div className="mt-auto flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 pt-3 sm:pt-5">
          <div>
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-slate-400">Price</p>
            <p className="text-lg sm:text-2xl font-black text-slate-950">{formatCurrency(item.price)}</p>
          </div>

          <div className="h-10 sm:h-12 w-full sm:w-36">
            {!item.is_available ? (
              <button
                type="button"
                disabled
                className="flex h-10 sm:h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-3 text-center text-[10px] sm:text-xs font-black leading-4 text-slate-500"
              >
                Unavailable
              </button>
            ) : quantity > 0 ? (
              <div className="flex h-10 sm:h-12 items-center justify-between rounded-full bg-emerald-600 p-1 text-white shadow-lg shadow-emerald-200">
                <button
                  type="button"
                  onClick={onDecrease}
                  className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
                  aria-label={`Decrease ${item.name}`}
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs sm:text-sm font-black">{quantity}</span>
                <button
                  type="button"
                  onClick={onIncrease}
                  className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-white text-emerald-700 transition hover:bg-emerald-50"
                  aria-label={`Increase ${item.name}`}
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                className="flex h-10 sm:h-12 w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-slate-950 px-3 sm:px-4 text-xs sm:text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-emerald-700"
              >
                <ShoppingBag size={15} />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  open,
  cart,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: {
  open: boolean;
  cart: QrCartItem[];
  onClose: () => void;
  onIncrease: (id: number) => void;
  onDecrease: (id: number) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // const gst = subtotal * 0.05;
  // const total = subtotal + gst;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-white text-slate-950 shadow-2xl sm:rounded-l-2xl">
        <div className="border-b border-slate-100 bg-gradient-to-br from-rose-50 to-emerald-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-700">Your order</p>
              <h2 className="mt-1 text-2xl font-black">Cart</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-700 shadow-sm transition hover:text-rose-600"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                  <ShoppingBag size={34} />
                </div>
                <h3 className="mt-5 text-xl font-black">Your cart is empty</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">Add a dish and it will appear here.</p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-black">{item.name}</h3>
                      <p className="text-sm font-bold text-emerald-700">{formatCurrency(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-400 transition hover:text-rose-600"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex h-9 items-center rounded-full bg-white p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onDecrease(item.id)}
                        className="grid h-7 w-7 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus size={13} />
                      </button>
                      <span className="grid w-8 place-items-center text-sm font-black">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onIncrease(item.id)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <p className="font-black">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 bg-white p-5 shadow-[0_-12px_35px_rgba(15,23,42,0.08)]">
          <div className="space-y-2 text-sm font-bold text-slate-500">
            {/* <div className="flex justify-between">
              <span>Total</span>
              <span className="text-slate-950">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST / Tax</span>
              <span className="text-slate-950">{formatCurrency(gst)}</span>
            </div> */}
            <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-lg text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>
        <Button
          type="button"
          disabled={cart.length === 0}
          onClick={onCheckout}
          className="m-5 mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          <ShoppingBag size={17} />
          Place Order
        </Button>
      </aside>
    </div>
  );
}

function CustomerDetailsModal({
  open,
  customer,
  error,
  placingOrder,
  onCustomerChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  customer: CustomerForm;
  error: string;
  placingOrder: boolean;
  onCustomerChange: (customer: CustomerForm) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Customer details
            </p>
            <h2 className="mt-1 text-2xl font-black">Place Order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={placingOrder}
            className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close customer details"
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-600">Table Number</span>
            <input
              value={customer.table_number}
              readOnly
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-700 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-600">Customer Name</span>
            <input
              value={customer.customer_name}
              onChange={(event) =>
                onCustomerChange({ ...customer, customer_name: event.target.value })
              }
              disabled={placingOrder}
              placeholder="Enter customer name"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-600">
              Customer Mobile Number
            </span>
            <input
              value={customer.customer_mobile}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 10);
                onCustomerChange({ ...customer, customer_mobile: value });
              }}
              disabled={placingOrder}
              inputMode="numeric"
              minLength={10}
              maxLength={10}
              placeholder="10 digit mobile number"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-600">Order Type</span>
            <select
              value={customer.order_type}
              onChange={(event) =>
                onCustomerChange({ ...customer, order_type: event.target.value as OrderMode })
              }
              disabled={placingOrder}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="Dine-In">Dine-In</option>
              <option value="Takeaway">Takeaway</option>
            </select>
          </label>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={placingOrder}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <ShoppingBag size={17} />
            {placingOrder ? "Placing Order..." : "Confirm Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QrMenuExperience({ tenantSlug, tableNo }: QrMenuExperienceProps) {
  const [getRestaurantDetails, setGetRestaurantDetails] =
    useState<QrRestaurantDetails | null>(null);
  const [menu, setMenu] = useState<QrMenuResponse | null>(null);
  const [status, setStatus] = useState<MenuStatus>("loading");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [cart, setCart] = useState<QrCartItem[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [customer, setCustomer] = useState<CustomerForm>({
    table_number: tableNo,
    customer_name: "",
    customer_mobile: "",
    order_type: "Dine-In",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadMenu(): Promise<void> {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/${encodeURIComponent(tenantSlug)}/admin/qr/${encodeURIComponent(tableNo)}`,
          { cache: "no-store", signal: controller.signal }
        );

        if (response.status === 404) {
          setStatus("table-not-found");
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const data: unknown = await response.json();

        if (!isQrMenuResponse(data) || !data.success) {
          setStatus("error");
          return;
        }

        setMenu(data);
        setStatus(data.menuItems.length === 0 ? "empty" : "ready");
        console.log(data);
        setGetRestaurantDetails(data.restaurantDetails); 

      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }

    loadMenu();

    return () => controller.abort();
  }, [tableNo, tenantSlug]);

  const tenantName = useMemo(() => getTenantDisplayName(tenantSlug), [tenantSlug]);
  const categoryNameById = useMemo(() => getCategoryNameById(menu?.category || []), [menu]);
  const categoryOptions = useMemo(
    () =>
      (menu?.category || [])
        .filter((category) => category.is_available)
        .map((category) => category.name)
        .filter((category) => category.trim() !== ""),
    [menu]
  );
  const activeCategory = categoryOptions.includes(selectedCategory)
    ? selectedCategory
    : (categoryOptions[0] || "");

  const visibleItems = useMemo(
    () =>
      (menu?.menuItems || []).filter((item) => {
        const categoryName = categoryNameById.get(item.category) || item.category;
        const matchesCategory = categoryName === activeCategory;
        const query = search.trim().toLowerCase();
        const matchesSearch =
          query === "" ||
          `${item.name} ${item.description} ${categoryName}`.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      }),
    [activeCategory, categoryNameById, menu, search]
  );

  const groupedItems = useMemo(
    () =>
      categoryOptions
        .filter((category) => category !== "All")
        .map((category) => ({
          category,
          items: visibleItems.filter(
            (item) => (categoryNameById.get(item.category) || item.category) === category
          ),
        }))
        .filter((group) => group.items.length > 0),
    [categoryNameById, categoryOptions, visibleItems]
  );

  const quantities = useMemo(() => new Map(cart.map((item) => [item.id, item.quantity])), [cart]);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(item: QrMenuItem): void {
    if (!item.is_available) return;

    const categoryName = categoryNameById.get(item.category) || item.category;

    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.id === item.id);

      if (existing) {
        return current.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }

      return [
        ...current,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          image_url: item.image_url || QR_MENU_PLACEHOLDER_IMAGE,
          category: categoryName,
          quantity: 1,
        },
      ];
    });
  }

  function changeQuantity(id: number, delta: number): void {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function openCheckout(): void {
    setOrderError("");
    setOrderSuccess("");
    setCustomer((current) => ({ ...current, table_number: tableNo }));
    setCartOpen(false);
    setCustomerModalOpen(true);
  }

  async function placeOrder(): Promise<void> {
    setOrderError("");
    setOrderSuccess("");

    const tableNumber = Number(customer.table_number);
    const customerName = customer.customer_name.trim();
    const customerMobile = customer.customer_mobile.trim();

    if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
      setOrderError("Valid table number is required.");
      return;
    }

    if (!customerName) {
      setOrderError("Customer name is required.");
      return;
    }

    if (!/^\d{10}$/.test(customerMobile)) {
      setOrderError("Customer mobile number must be exactly 10 digits.");
      return;
    }

    if (customer.order_type !== "Dine-In" && customer.order_type !== "Takeaway") {
      setOrderError("Order type is required.");
      return;
    }

    if (cart.length === 0) {
      setOrderError("Add at least one item before placing the order.");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch(`/api/${encodeURIComponent(tenantSlug)}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_number: tableNumber,
          customer_name: customerName,
          customer_mobile: customerMobile,
          order_type: customer.order_type,
          items: cart.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as OrderApiResponse;

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Unable to place order.");
      }

      const orderId = data.order?.order_id || data.order?.id;

      setCart([]);
      setCustomerModalOpen(false);
      setCartOpen(false);
      setCustomer((current) => ({
        ...current,
        customer_name: "",
        customer_mobile: "",
        order_type: "Dine-In",
      }));
      setOrderSuccess(
        orderId
          ? `Your order has been placed. This is your order id: ${orderId}`
          : "Your order has been placed."
      );
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Unable to place order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (status === "table-not-found") {
    return (
      <StatusPanel
        title="Table Number Not Found"
        message="This QR code does not match an active table for this restaurant."
        showBack
      />
    );
  }

  if (status === "error") {
    return (
      <StatusPanel
        title="Unable to load menu."
        message="Please check the QR code or try again in a moment."
      />
    );
  }

  const isLoading = status === "loading";
  const isEmpty = status === "empty" || (!isLoading && visibleItems.length === 0);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f8fafc_32%,#ecfdf5_100%)] text-slate-950">
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 p-4 lg:p-6">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-80 shrink-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 text-white shadow-2xl lg:flex">
          <div className="p-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black text-emerald-800 shadow-xl shadow-black/20">
                {tenantName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                  Table No: {tableNo}
                </p>
                <h2 className="text-lg font-black">{getRestaurantDetails?.restaurant_name}</h2>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
            <p className="px-3 text-xs font-black uppercase tracking-[0.25em] text-emerald-200/80">
              Categories
            </p>
            {categoryOptions.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                    isActive
                      ? "border-white/40 bg-white text-emerald-950 shadow-xl shadow-black/20"
                      : "border-white/10 bg-white/5 text-emerald-50 hover:border-white/25 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white/10 text-emerald-100 group-hover:bg-white/15"
                    }`}
                  >
                    <Utensils size={17} />
                  </span>
                  <span className="flex-1">{category}</span>
                  <ChevronRight size={13} className="opacity-60" />
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/70 bg-white/50 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <header className="sticky top-0 z-40 border-b border-white/60 bg-rose-50/80 px-4 py-3 backdrop-blur-2xl lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileCategoriesOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 lg:hidden"
                aria-label="Open categories"
              >
                <Menu size={20} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
                  {getRestaurantDetails?.restaurant_name}
                </p>
                <p className="hidden text-sm font-medium text-slate-500 sm:block">
                  Table No: {tableNo}
                </p>
              </div>

              <label className="relative hidden max-w-xl flex-[1.2] md:block">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search dishes"
                  className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative grid h-12 w-12 place-items-center rounded-full bg-slate-950 text-white shadow-xl shadow-slate-300 transition hover:bg-emerald-700"
                aria-label="Open cart"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-rose-500 px-1.5 text-xs font-black text-white ring-4 ring-rose-50">
                    {totalItems}
                  </span>
                ) : null}
              </button>
            </div>
          </header>

          <section className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/80 bg-white/70 p-5 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                Welcome to {getRestaurantDetails?.restaurant_name}
              </p>
              <h1 className="mt-1 text-2xl font-black text-slate-950">Table No: {tableNo}</h1>
            </div>

            <label className="relative mt-4 block md:hidden">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dishes"
                className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="mt-4 flex gap-3 overflow-x-auto py-4 lg:hidden">
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold transition ${
                    activeCategory === category
                      ? "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "border-slate-200 bg-white text-slate-600 shadow-sm"
                  }`}
                >
                  <Utensils size={15} />
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                  {activeCategory}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Popular Dishes</h2>
              </div>
              <p className="text-sm font-bold text-slate-500">
                {isLoading ? "Loading" : `${visibleItems.length} items`}
              </p>
            </div>

            {orderSuccess ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-900">
                {orderSuccess}
              </div>
            ) : null}

            {isLoading ? (
              <div className="mt-5 grid grid-cols-2 gap-3 pb-24 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4 lg:pb-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : activeCategory === "All" ? (
              <div className="mt-5 space-y-8 pb-24 lg:pb-8">
                {groupedItems.map((group) => (
                  <section key={group.category}>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 className="text-xl font-black text-slate-950">{group.category}</h3>
                      <p className="text-sm font-bold text-slate-500">{group.items.length} items</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {group.items.map((item) => {
                        const categoryName = categoryNameById.get(item.category) || item.category;
                        const quantity = quantities.get(item.id) || 0;

                        return (
                          <MenuCard
                            key={item.id}
                            item={item}
                            categoryName={categoryName}
                            quantity={quantity}
                            onAdd={() => addToCart(item)}
                            onDecrease={() => changeQuantity(item.id, -1)}
                            onIncrease={() => changeQuantity(item.id, 1)}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3 pb-24 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4 lg:pb-8">
                {visibleItems.map((item) => {
                  const categoryName = categoryNameById.get(item.category) || item.category;
                  const quantity = quantities.get(item.id) || 0;

                  return (
                    <MenuCard
                      key={item.id}
                      item={item}
                      categoryName={categoryName}
                      quantity={quantity}
                      onAdd={() => addToCart(item)}
                      onDecrease={() => changeQuantity(item.id, -1)}
                      onIncrease={() => changeQuantity(item.id, 1)}
                    />
                  );
                })}
              </div>
            )}

            {isEmpty ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-10 text-center">
                <h3 className="text-xl font-black">No menu items available.</h3>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  Please try another search or category.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {mobileCategoriesOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close categories"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileCategoriesOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,22rem)] flex-col overflow-hidden bg-gradient-to-b from-emerald-950 via-teal-950 to-slate-950 p-4 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3 shrink-0">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
                  Table No: {tableNo}
                </p>
                <h2 className="text-lg font-black">{getRestaurantDetails?.restaurant_name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileCategoriesOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
                aria-label="Close categories"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto pb-6">
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setMobileCategoriesOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                    activeCategory === category
                      ? "border-white/40 bg-white text-emerald-950"
                      : "border-white/10 bg-white/5 text-emerald-50"
                  }`}
                >
                  <Utensils size={17} />
                  {category}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-4 right-4 z-30 flex h-14 items-center gap-3 rounded-full bg-slate-950 px-5 font-black text-white shadow-2xl shadow-slate-400 transition hover:bg-emerald-700 lg:hidden"
      >
        <ShoppingBag size={19} />
        {totalItems} item{totalItems === 1 ? "" : "s"}
      </button>

      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onIncrease={(id) => changeQuantity(id, 1)}
        onDecrease={(id) => changeQuantity(id, -1)}
        onRemove={(id) => setCart((current) => current.filter((item) => item.id !== id))}
        onCheckout={openCheckout}
      />

      <CustomerDetailsModal
        open={customerModalOpen}
        customer={customer}
        error={orderError}
        placingOrder={placingOrder}
        onCustomerChange={setCustomer}
        onClose={() => {
          if (!placingOrder) setCustomerModalOpen(false);
        }}
        onSubmit={placeOrder}
      />
    </main>
  );
}
