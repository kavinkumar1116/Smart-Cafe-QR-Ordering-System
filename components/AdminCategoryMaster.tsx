"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import type { CategoryForm, MenuItem, MenuResponse } from "@/types/cafe";

const emptyForm: CategoryForm = {
  id: null,
  name: "",
  image_url: "",
  is_available: true,
};

export default function AdminCategoryManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadItems() {
    const response = await fetch("/api/admin/menu", { cache: "no-store" });
    const data = (await response.json()) as MenuResponse;
    setItems(data.items || []);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function saveItem(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    const method = form.id ? "PUT" : "POST";
    const response = await fetch("/api/admin/menu", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (response.ok) {
      setForm(emptyForm);
      loadItems();
    }
  }

  async function deleteItem(id: number): Promise<void> {
    await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
    loadItems();
  }

  return (
    <AdminGuard>
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={saveItem} className="glass-panel h-fit rounded-lg p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-saffron">Category</p>
              <h2 className="mt-1 text-2xl font-semibold text-crema">{form.id ? "Edit Category" : "Add Category"}</h2>
            </div>
            {form.id ? (
              <button
                type="button"
                onClick={() => setForm(emptyForm)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema"
                aria-label="Cancel edit"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Category name"
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none placeholder:text-crema/35 focus:border-saffron"
            />
            <input
              value={form.image_url}
              onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
              placeholder="Image URL"
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-3 text-crema outline-none placeholder:text-crema/35 focus:border-saffron"
            />
            <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/8 px-3 py-3 text-crema/72">
              <span>Available</span>
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(event) => setForm((current) => ({ ...current, is_available: event.target.checked }))}
                className="h-5 w-5 accent-saffron"
              />
            </label>
          </div>

          <button
            disabled={saving}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-3 font-semibold text-espresso disabled:opacity-60"
          >
            {form.id ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
            {saving ? "Saving..." : form.id ? "Save Changes" : "Add Category"}
          </button>
        </form>

        <section className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-white/10 bg-white/8 p-4">
              <div className="grid gap-4 md:grid-cols-[120px_1fr_auto] md:items-center">
                <img
                  src={item.image_url || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80"}
                  alt={item.name}
                  className="h-28 w-full rounded-lg object-cover md:w-28"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-crema">{item.name}</h3>
                    <span className="rounded-lg bg-white/10 px-2 py-1 text-xs text-crema/62">{item.category}</span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${item.is_available ? "bg-moss/25 text-crema" : "bg-berry/25 text-crema"}`}>
                      {item.is_available ? "Available" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-crema/58">{item.description}</p>
                  <p className="mt-2 font-semibold text-saffron">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex gap-2 md:flex-col">
                  <button
                    onClick={() =>
                      setForm({
                        id: item.id,
                        name: item.name,
                        image_url: item.image_url,
                        is_available: item.is_available,
                      })
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema"
                    aria-label="Edit menu item"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema"
                    aria-label="Delete menu item"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminGuard>
  );
}
