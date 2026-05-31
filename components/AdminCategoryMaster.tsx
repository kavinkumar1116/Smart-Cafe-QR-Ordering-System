"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useRealtimeTable } from "@/lib/supabase/realtime";
import { tenantApiFetch } from "@/lib/tenant";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import type { Category, CategoryForm } from "@/types/cafe";

const emptyForm: CategoryForm = {
  id: null,
  name: "",
  image_url: "",
  is_available: true,
};

export default function AdminCategoryManager() {
  const [form, setForm]               = useState<CategoryForm>(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [CategoriesList, setCategoriesList] = useState<Category[]>([]);
  const [validationError, setValidationError] = useState("");

  const loadItems = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/category", { cache: "no-store" });
    const data = await response.json();
    setCategoriesList(data.items || []);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);
  useRealtimeTable({ table: "categories", onChange: loadItems });

  function openAdd() {
    setForm(emptyForm);
    setValidationError("");
    setModalOpen(true);
  }

  function openEdit(item: Category) {
    setForm({ id: item.id, name: item.name, image_url: item.image_url, is_available: item.is_available });
    setValidationError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setValidationError("");
  }

  async function saveItem(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    // ── Validation ──────────────────────────────────────────────
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setValidationError("Category name is required.");
      return;
    }
    if (trimmedName.length < 2) {
      setValidationError("Category name must be at least 2 characters.");
      return;
    }
    const duplicate = CategoriesList.some(
      (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase() && c.id !== form.id
    );
    if (duplicate) {
      setValidationError(`"${trimmedName}" already exists. Please use a different name.`);
      return;
    }

    setValidationError("");
    setSaving(true);

    const method = form.id ? "PUT" : "POST";
    const response = await tenantApiFetch("/api/admin/category", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, name: trimmedName }),
    });

    setSaving(false);

    if (response.ok) {
      closeModal();
      loadItems();
    } else {
      const data = await response.json().catch(() => ({}));
      setValidationError(data?.error || "Failed to save category. Please try again.");
    }
  }

  async function deleteItem(id: number): Promise<void> {
    await tenantApiFetch(`/api/admin/category?id=${id}`, { method: "DELETE" });
    loadItems();
  }

  return (
    <AdminGuard>

      {/* ── Modal ─────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e1512] p-6 shadow-2xl shadow-black/50">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-saffron">Category</p>
                <h3 className="mt-0.5 text-xl font-semibold text-crema">
                  {form.id ? "Edit Category" : "Add Category"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-crema/70 transition hover:text-crema disabled:opacity-50"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={saveItem} noValidate className="mt-5 space-y-3">

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-widest text-crema/40">
                  Category Name <span className="text-berry">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    setForm((c) => ({ ...c, name: e.target.value }));
                    setValidationError("");
                  }}
                  placeholder="e.g. Beverages"
                  className={`w-full rounded-lg border px-3 py-2.5 text-[13px] text-crema outline-none placeholder:text-crema/30 bg-white/5 transition focus:border-saffron ${
                    validationError ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                {validationError && (
                  <p className="text-[12px] text-red-400">{validationError}</p>
                )}
              </div>

              {/* Availability toggle */}
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="text-[13px] text-crema/70">Available</span>
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm((c) => ({ ...c, is_available: e.target.checked }))}
                  className="h-4 w-4 accent-saffron"
                />
              </label>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2.5 text-[13px] font-medium text-crema/70 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-saffron py-2.5 text-[13px] font-semibold text-espresso transition hover:bg-[#efb150] disabled:opacity-60"
                >
                  {form.id ? <Save size={15} /> : <Plus size={15} />}
                  {saving ? "Saving..." : form.id ? "Save Changes" : "Add Category"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Page ──────────────────────────────────────────────── */}
      <section className="space-y-5">

        {/* Header */}
        <div className="glass-panel rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-saffron">Categories Management</p>
              <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Categories</h2>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-2.5 text-[13px] font-semibold text-espresso transition hover:bg-[#efb150]"
            >
              <Plus size={16} aria-hidden="true" />
              Add Category
            </button>
          </div>
        </div>

        {/* Table panel */}
        <div className="rounded-2xl border border-white/8 bg-espresso/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">

              {/* Sticky head */}
              <thead className="sticky top-0 z-10">
                <tr>
                  {["SI.No", "Category Name", "Status", "Edit", "Delete"].map((col, i) => (
                    <th
                      key={col}
                      className={`border-b border-white/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-crema/40 whitespace-nowrap ${
                        i === 0 ? "w-16 text-center" :
                        i === 2 ? "w-28 text-center" :
                        i >= 3  ? "w-20 text-center" :
                        "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {CategoriesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[13px] text-crema/40">
                      No categories yet. Click <span className="text-saffron">Add Category</span> to create one.
                    </td>
                  </tr>
                ) : (
                  CategoriesList.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 transition hover:bg-white/4 last:border-b-0"
                    >
                      {/* SI.No */}
                      <td className="px-5 py-3 text-center text-[13px] text-crema/35">
                        {idx + 1}
                      </td>

                      {/* Category Name */}
                      <td className="px-5 py-3 text-[13px] font-medium text-crema">
                        {item.name}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold ${
                          item.is_available
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-red-500/30  bg-red-500/10  text-red-400"
                        }`}>
                          {item.is_available ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Edit */}
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-crema/60 transition hover:border-saffron/40 hover:bg-saffron/10 hover:text-saffron"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-crema/60 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {CategoriesList.length > 0 && (
            <div className="border-t border-white/8 px-5 py-3">
              <p className="text-[12px] text-crema/30">
                {CategoriesList.length} categor{CategoriesList.length !== 1 ? "ies" : "y"}
              </p>
            </div>
          )}
        </div>

      </section>
    </AdminGuard>
  );
}
