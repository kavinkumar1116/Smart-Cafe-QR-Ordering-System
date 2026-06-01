"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { tenantApiFetch } from "@/lib/tenant";
import { useRealtimeTable } from "@/lib/supabase/realtime";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import type { CafeTable, TableForm } from "@/types/cafe";

const emptyForm: TableForm = {
  id: null,
  table_number: "",
};

export default function AdminTableMaster() {
  const [form, setForm] = useState<TableForm>(emptyForm);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  const loadTables = useCallback(async () => {
    const response = await tenantApiFetch("/api/admin/tables", { cache: "no-store" });
    const data = await response.json();
    setTables(data.tables || []);
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useRealtimeTable({ table: "cafe_tables", onChange: loadTables });

  function openAdd() {
    setForm(emptyForm);
    setValidationError("");
    setModalOpen(true);
  }

  function openEdit(table: CafeTable) {
    setForm({ id: table.id, table_number: String(table.table_number) });
    setValidationError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setValidationError("");
  }

  async function saveTable(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const tableNumber = Number(form.table_number);

    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
      setValidationError("Enter a valid table number.");
      return;
    }

    const duplicate = tables.some(
      (table) => table.table_number === tableNumber && table.id !== form.id
    );

    if (duplicate) {
      setValidationError(`Table ${tableNumber} already exists.`);
      return;
    }

    setValidationError("");
    setSaving(true);

    const response = await tenantApiFetch("/api/admin/tables", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: form.id, table_number: tableNumber }),
    });

    setSaving(false);

    if (response.ok) {
      closeModal();
      loadTables();
      return;
    }

    const data = await response.json().catch(() => ({}));
    setValidationError(data?.error || data?.detail || "Failed to save table.");
  }

  async function deleteItem(id: number): Promise<void> {
    await tenantApiFetch(`/api/admin/tables?id=${id}`, { method: "DELETE" });
    loadTables();
  }

  return (
    <AdminGuard>
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">Table</p>
                <h3 className="mt-0.5 text-xl font-semibold text-slate-900">
                  {form.id ? "Edit Table" : "Add Table"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={saveTable} noValidate className="mt-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.table_number}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, table_number: event.target.value }));
                    setValidationError("");
                  }}
                  inputMode="numeric"
                  placeholder="e.g. 12"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 bg-white transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                    validationError ? "border-red-500/60" : "border-slate-300"
                  }`}
                />
                {validationError ? (
                  <p className="text-[12px] text-rose-600">{validationError}</p>
                ) : null}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  {form.id ? <Save size={15} /> : <Plus size={15} />}
                  {saving ? "Saving..." : form.id ? "Save Changes" : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600">Table Management</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Tables</h2>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              <Plus size={16} aria-hidden="true" />
              Add Table
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr>
                  {["SI.No", "Table Number", "Edit", "Delete"].map((col, index) => (
                    <th
                      key={col}
                      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 whitespace-nowrap ${
                        index === 0 || index >= 2 ? "w-20 text-center" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tables.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-slate-500">
                      No tables yet. Click <span className="font-semibold text-emerald-600">Add Table</span> to create one.
                    </td>
                  </tr>
                ) : (
                  tables.map((table, index) => (
                    <tr
                      key={table.id}
                      className="border-b border-slate-200 transition hover:bg-slate-50 last:border-b-0"
                    >
                      <td className="px-6 py-4 text-center text-sm text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                          Table {table.table_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => openEdit(table)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:border-slate-400"
                          aria-label={`Edit table ${table.table_number}`}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => deleteItem(table.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                          aria-label={`Delete table ${table.table_number}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {tables.length > 0 ? (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">
              <p className="text-sm text-slate-600">
                {tables.length} table{tables.length !== 1 ? "s" : ""}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </AdminGuard>
  );
}
