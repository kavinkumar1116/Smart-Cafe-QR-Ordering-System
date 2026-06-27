"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X, LucideIcon, Upload
} from "lucide-react";

import type { FormEvent } from "react";

import AdminGuard from "@/components/AdminGuard";
import { tenantApiFetch } from "@/lib/tenant";
import { formatCurrency } from "@/lib/format";
import { useRealtimeTable } from "@/lib/supabase/realtime";

import type {
  AdminMenuForm,
  MenuItem,
  MenuResponse,
} from "@/types/cafe";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  menuImageFile: "",
};

function ActionButton({
  label,
  icon: Icon,
  tone = "secondary",
  onClick,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "danger"
        ? "border border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200"
        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${toneClass} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

export default function AdminMenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<AdminMenuForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);

  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [menuImageFile, setmenuImageFile] = useState<File | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    category: "",
  });

  const loadItems = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/menu", {
      cache: "no-store",
    });

    const data = (await response.json()) as MenuResponse;

    setItems(data.items || []);
  }, []);

  const loadCategories = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/category", {
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;
    setmenuImageFile(file);
    setSelectedFileName(file.name);
  };

  function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}
  async function saveItem(
  event: FormEvent<HTMLFormElement>
): Promise<void> {
  event.preventDefault();

  // Image is required only when creating a new menu item
  if (!form.id && !menuImageFile) {
    alert("Please upload an image");
    return;
  }

  if (!validateForm()) return;

  let imageBase64 = "";

  // Convert to Base64 only if a new image is selected
  if (menuImageFile) {
    imageBase64 = await fileToBase64(menuImageFile);
  }

  setSaving(true);

  const method = form.id ? "PUT" : "POST";

  const response = await tenantApiFetch("/api/admin/menu", {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...form,
      menuImageFile: imageBase64,
    }),
  });

  setSaving(false);

  if (response.ok) {
    setForm(emptyForm);
    setmenuImageFile(null); // Reset selected file
    setShowModal(false);
    loadItems();
  }
}
  async function deleteItem(id: number): Promise<void> {
    await tenantApiFetch(`/api/admin/menu?id=${id}`, {
      method: "DELETE",
    });

    loadItems();
  }

  function handleEdit(item: MenuItem) {
    setmenuImageFile(null);
    setSelectedFileName("");
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
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Menu Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Menu Listing
            </h1>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* ADD BUTTON */}
            <button
              onClick={handleAddMenu}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              <Plus size={18} />
              Add Menu
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm text-slate-600">
                Total Items: {items.length}
              </p>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search menu..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:w-72"
                />
              </div>
            </div>
            <table className="min-w-full border-collapse">

              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    SI.No
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Image
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Menu Name
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Price
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                    Active Status
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    Edit
                  </th>

                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                    Delete
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {(currentPage - 1) *
                          rowsPerPage +
                          index +
                          1}
                      </td>

                      <td className="px-6 py-4">
                        <img
                          src={
                            item.image_url ||
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={item.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {categories.find(
                          (c) =>
                            c.id ===
                            parseInt(item.category)
                        )?.name || "Unknown"}
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.is_available
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.is_available
                            ? "Available"
                            : "Not Available"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:border-slate-400"
                        >
                          <Pencil size={17} />
                        </button>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            deleteItem(item.id)
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
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
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      No menu items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
            {/* ROWS PER PAGE */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">
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
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* PAGE BUTTONS */}
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600">
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
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
              {/* HEADER */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">
                    Menu Management
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
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
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
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
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />

                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">
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
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />

                    {errors.price && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <Popover open={openCategory} onOpenChange={setOpenCategory}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCategory}
                          className={cn(
                            "h-[50px] w-full justify-between border border-slate-200 bg-white font-normal text-slate-900 hover:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                            !form.category && "text-slate-400"
                          )}
                        >
                          {form.category
                            ? categories.find((c) => c.id.toString() === form.category)?.name
                            : "Select Category"}
                          <ChevronsUpDown size={16} className="ml-2 shrink-0 text-slate-400" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search category..."
                            className="h-10 border-none text-sm focus:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty>
                              <p className="py-4 text-center text-sm text-slate-500">
                                No category found.
                              </p>
                            </CommandEmpty>
                            <CommandGroup>
                              {categories.map((category) => (
                                <CommandItem
                                  key={category.id}
                                  value={category.name}           // searched against this
                                  onSelect={() => {
                                    setForm((current) => ({
                                      ...current,
                                      category:
                                        current.category === category.id.toString()
                                          ? ""
                                          : category.id.toString(),
                                    }));
                                    setOpenCategory(false);
                                  }}
                                >
                                  <Check
                                    size={16}
                                    className={cn(
                                      "mr-2 shrink-0 text-emerald-600",
                                      form.category === category.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {category.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {errors.category && (
                      <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                    )}
                  </div>
                </div>
                <ActionButton
                  label="Upload Logo"
                  icon={Upload}
                  onClick={handleUploadClick}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-slate-600">
                  {selectedFileName || "No file selected"}
                </p>

                <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                  <span className="text-sm text-slate-900">
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
                    className="h-5 w-5 accent-emerald-600"
                  />
                </label>

                <button
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
