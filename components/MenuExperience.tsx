"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Search, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { calcSubtotal } from "@/lib/order-math";
import type { CartItem, MenuItem, MenuResponse } from "@/types/cafe";

const CART_KEY = "smart-cafe-cart";

interface MenuSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
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
  tableId: string;
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
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => {
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

export default function MenuExperience({ tableId }: MenuExperienceProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMenu() {
      const response = await fetch("/api/menu");
      const data = (await response.json()) as MenuResponse;
      setItems(data.items || []);
      setLoading(false);
    }

    const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]") as CartItem[];
    setCart(savedCart);
    loadMenu();
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.category).filter(Boolean)))],
    [items]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (!item.is_available) return false;
        if (category !== "All" && item.category !== category) return false;
        if (!search.trim()) return true;
        const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [category, items, search]
  );

  const visibleGroups = useMemo<MenuGroup[]>(() => {
    if (category !== "All") {
      return [{ category, items: filteredItems }];
    }

    return Array.from(new Set(filteredItems.map((item) => item.category))).map((cat) => ({
      category: cat,
      items: filteredItems.filter((item) => item.category === cat),
    }));
  }, [category, filteredItems]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = calcSubtotal(cart);

  function addToCart(menuItem: MenuItem): void {
    setCart((current) => {
      const existing = current.find((item) => item.id === menuItem.id);
      if (existing) {
        return current.map((item) =>
          item.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: Number(menuItem.price),
          image_url: menuItem.image_url,
          category: menuItem.category,
          quantity: 1,
          table_id: Number(tableId),
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

  return (
    <div className="grid gap-6 pb-20 xl:grid-cols-[1fr_360px] xl:pb-0">
      <section className="space-y-5">
        <div className="glass-panel rounded-lg p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-saffron">Table {tableId}</p>
              <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Digital Menu</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-crema/62">
                Browse categories, add to cart, then checkout with your name and WhatsApp number.
              </p>
            </div>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso"
            >
              <ShoppingCart size={18} aria-hidden="true" />
              Cart ({totalItems})
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <MenuSearchBar value={search} onChange={setSearch} />
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/12 px-4 py-3 text-sm text-crema/62 md:justify-end md:gap-3">
              <span className="font-semibold text-crema">Subtotal</span>
              <span className="font-semibold text-crema">{formatCurrency(cartSubtotal)}</span>
            </div>
          </div>
        </div>

        <CategoryChips categories={categories} active={category} onChange={setCategory} />

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
            Loading menu...
          </div>
        ) : visibleGroups.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
            No menu items found.
          </div>
        ) : (
          <div className="space-y-7">
            {visibleGroups.map((group) => (
              <div key={group.category || "all"}>
                {category === "All" ? (
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-crema">{group.category}</h3>
                    <span className="text-sm text-crema/50">{group.items.length} items</span>
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => {
                    const cartItem = cart.find((entry) => entry.id === item.id);

                    return (
                      <article
                        key={item.id}
                        className="overflow-hidden rounded-lg border border-white/10 bg-white/8 transition hover:-translate-y-0.5 hover:bg-white/12"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-white/6">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-crema/45">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase text-saffron">
                                {item.category}
                              </p>
                              <h3 className="mt-1 text-lg font-semibold text-crema">
                                {item.name}
                              </h3>
                            </div>
                            <p className="shrink-0 font-semibold text-crema">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className="mt-3 min-h-12 text-sm leading-6 text-crema/62">
                            {item.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3">
                            {cartItem ? (
                              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/15 p-1">
                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-crema"
                                  onClick={() => changeQuantity(item.id, -1)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="w-7 text-center font-semibold text-crema">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-crema"
                                  onClick={() => changeQuantity(item.id, 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-crema/58">Add to order</span>
                            )}
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-espresso transition hover:bg-[#efb150]"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="glass-panel h-fit rounded-lg p-5">
        <h3 className="text-lg font-semibold text-crema">Current Cart</h3>
        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="rounded-lg bg-white/8 p-4 text-sm text-crema/60">No items added yet.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/8 p-3">
                <div>
                  <p className="font-medium text-crema">{item.name}</p>
                  <p className="text-sm text-crema/58">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                </div>
                <p className="font-semibold text-crema">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))
          )}
        </div>
      </aside>

      <StickyCartBar href="/cart" itemCount={totalItems} total={cartSubtotal} />
    </div>
  );
}
