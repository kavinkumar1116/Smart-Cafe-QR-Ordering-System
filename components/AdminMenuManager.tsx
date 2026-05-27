"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import type { FormEvent } from "react";

import AdminGuard from "@/components/AdminGuard";
import { formatCurrency } from "@/lib/format";
import { useRealtimeTable } from "@/lib/supabase/realtime";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  AdminMenuForm,
  MenuItem,
  MenuResponse,
} from "@/types/cafe";

type Category = {
  id: number;
  name: string;
};

const emptyForm: AdminMenuForm = {
  id: null,
  name: "",
  description: "",
  price: "",
  category: "",
  image_url: "",
  is_available: true,
};

export default function AdminMenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<AdminMenuForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    category: "",
  });

  const loadItems = useCallback(async () => {
    const response = await fetch("/api/admin/menu", {
      cache: "no-store",
    });

    const data = (await response.json()) as MenuResponse;

    setItems(data.items || []);
  }, []);

  const loadCategories = useCallback(async () => {
    const response = await fetch("/api/admin/category", {
      cache: "no-store",
    });

    const data = (await response.json()) as {
      items: Category[];
    };

    setCategories(data.items || []);
  }, []);

  useEffect(() => {
    loadItems();
    loadCategories();
  }, [loadCategories, loadItems]);

  useRealtimeTable({ table: "menu_items", onChange: loadItems });
  useRealtimeTable({ table: "categories", onChange: loadCategories });

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const totalPages = Math.ceil(
    filteredItems.length / rowsPerPage
  );

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  function validateForm() {
    const newErrors = {
      name: "",
      price: "",
      category: "",
    };

    let valid = true;

    if (!form.name.trim()) {
      newErrors.name = "Menu name is required";
      valid = false;
    }

    const duplicate = items.find(
      (item) =>
        item.name.toLowerCase() ===
          form.name.toLowerCase() &&
        item.id !== form.id
    );

    if (duplicate) {
      newErrors.name = "Menu name already exists";
      valid = false;
    }

    if (!form.price) {
      newErrors.price = "Price is required";
      valid = false;
    }

    if (!form.category) {
      newErrors.category = "Category is required";
      valid = false;
    }

    setErrors(newErrors);

    return valid;
  }

  async function saveItem(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    const method = form.id ? "PUT" : "POST";

    const response = await fetch("/api/admin/menu", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (response.ok) {
      setForm(emptyForm);
      setShowModal(false);
      loadItems();
    }
  }

  async function deleteItem(id: number): Promise<void> {
    await fetch(`/api/admin/menu?id=${id}`, {
      method: "DELETE",
    });

    loadItems();
  }

  function handleEdit(item: MenuItem) {
    setForm({
      ...item,
      price: String(item.price),
    });

    setShowModal(true);
  }

  function handleAddMenu() {
    setForm(emptyForm);

    setErrors({
      name: "",
      price: "",
      category: "",
    });

    setShowModal(true);
  }

  return (
    <AdminGuard>
      <div className="space-y-5">
        {/* HEADER */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-saffron">
              Menu Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-crema">
              Menu Listing
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* SEARCH */}


            {/* ADD BUTTON */}
            <button
              onClick={handleAddMenu}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-saffron px-5 text-sm font-semibold text-espresso transition hover:opacity-90"
            >
              <Plus size={18} />
              Add Menu
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="overflow-x-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <p className="text-sm text-white/100">
              Total Items: {items.length}
            </p>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-crema/40"
              />

              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-xl border border-white/10 bg-white/10 pl-10 pr-4 text-sm text-crema outline-none placeholder:text-crema/40 focus:border-saffron sm:w-72"
              />
            </div>
          </div>
            <table className="min-w-full border-collapse">
              
              <thead className="sticky top-0 bg-[#1f1f1f]">
                <tr className="border-b border-white/10">
                  <th className="px-5 py-4 text-left text-sm font-semibold text-crema">
                    SI.No
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-crema">
                    Image
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-crema">
                    Menu Name
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-crema">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-crema">
                    Price
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold text-crema">
                    Active Status
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold text-crema">
                    Edit
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-semibold text-crema">
                    Delete
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 transition hover:bg-white/5"
                    >
                      <td className="px-5 py-4 text-sm text-crema/80">
                        {(currentPage - 1) *
                          rowsPerPage +
                          index +
                          1}
                      </td>

                      <td className="px-5 py-4">
                        <img
                          src={
                            item.image_url ||
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={item.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="font-medium text-crema">
                            {item.name}
                          </p>

                          <p className="mt-1 line-clamp-1 text-xs text-crema/50">
                            {item.description}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-crema/70">
                        {categories.find(
                          (c) =>
                            c.id ===
                            parseInt(item.category)
                        )?.name || "Unknown"}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-saffron">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            item.is_available
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {item.is_available
                            ? "Available"
                            : "Not Available"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-crema transition hover:bg-white/10"
                        >
                          <Pencil size={17} />
                        </button>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() =>
                            deleteItem(item.id)
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-crema/50"
                    >
                      No menu items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
            {/* ROWS PER PAGE */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-crema/70">
                Rows per page
              </p>

              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(
                    Number(e.target.value)
                  );

                  setCurrentPage(1);
                }}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-crema outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* PAGE BUTTONS */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-crema/70">
                Page {currentPage} of{" "}
                {totalPages || 1}
              </p>

              <button
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-crema transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={
                  currentPage === totalPages ||
                  totalPages === 0
                }
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                  )
                }
                className="rounded-lg bg-saffron px-4 py-2 text-sm font-medium text-espresso transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1d1d1d] p-6">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-saffron">
                    Menu Management
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-crema">
                    {form.id
                      ? "Edit Menu"
                      : "Add Menu"}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setForm(emptyForm);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-crema"
                >
                  <X size={18} />
                </button>
              </div>

              {/* FORM */}
              <form
                onSubmit={saveItem}
                className="mt-6 space-y-4"
              >
                <div>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Menu Name"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-crema outline-none placeholder:text-crema/40 focus:border-saffron"
                  />

                  {errors.name && (
                    <p className="mt-1 text-xs text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  placeholder="Description"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-crema outline-none placeholder:text-crema/40 focus:border-saffron"
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <input
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      placeholder="Price"
                      inputMode="numeric"
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-crema outline-none placeholder:text-crema/40 focus:border-saffron"
                    />

                    {errors.price && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <Select
                      value={form.category}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          category: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-[50px] w-full border border-white/10 bg-white/10 text-crema">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>

                      <SelectContent>
                        {categories.map(
                          (category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {errors.category && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.category}
                      </p>
                    )}
                  </div>
                </div>

                <input
                  value={form.image_url}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      image_url:
                        event.target.value,
                    }))
                  }
                  placeholder="Image URL"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-crema outline-none placeholder:text-crema/40 focus:border-saffron"
                />

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4">
                  <span className="text-sm text-crema">
                    Available Status
                  </span>

                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        is_available:
                          event.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-saffron"
                  />
                </label>

                <button
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-saffron text-sm font-semibold text-espresso transition hover:opacity-90 disabled:opacity-50"
                >
                  {form.id ? (
                    <Save size={18} />
                  ) : (
                    <Plus size={18} />
                  )}

                  {saving
                    ? "Saving..."
                    : form.id
                    ? "Save Changes"
                    : "Add Menu"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
