"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
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
    const response = await fetch("/api/admin/tables", { cache: "no-store" });
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

    const response = await fetch("/api/admin/tables", {
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
    await fetch(`/api/admin/tables?id=${id}`, { method: "DELETE" });
    loadTables();
  }

  return (
    <AdminGuard>
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1e1512] p-6 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-saffron">Table</p>
                <h3 className="mt-0.5 text-xl font-semibold text-crema">
                  {form.id ? "Edit Table" : "Add Table"}
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

            <form onSubmit={saveTable} noValidate className="mt-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-widest text-crema/40">
                  Table Number <span className="text-berry">*</span>
                </label>
                <input
                  value={form.table_number}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, table_number: event.target.value }));
                    setValidationError("");
                  }}
                  inputMode="numeric"
                  placeholder="e.g. 12"
                  className={`w-full rounded-lg border px-3 py-2.5 text-[13px] text-crema outline-none placeholder:text-crema/30 bg-white/5 transition focus:border-saffron ${
                    validationError ? "border-red-500/60" : "border-white/10"
                  }`}
                />
                {validationError ? (
                  <p className="text-[12px] text-red-400">{validationError}</p>
                ) : null}
              </div>

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
                  {saving ? "Saving..." : form.id ? "Save Changes" : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="space-y-5">
        <div className="glass-panel rounded-lg p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-saffron">Table Management</p>
              <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Tables</h2>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-2.5 text-[13px] font-semibold text-espresso transition hover:bg-[#efb150]"
            >
              <Plus size={16} aria-hidden="true" />
              Add Table
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-espresso/60">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  {["SI.No", "Table Number", "Edit", "Delete"].map((col, index) => (
                    <th
                      key={col}
                      className={`border-b border-white/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-crema/40 whitespace-nowrap ${
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
                    <td colSpan={4} className="px-5 py-12 text-center text-[13px] text-crema/40">
                      No tables yet. Click <span className="text-saffron">Add Table</span> to create one.
                    </td>
                  </tr>
                ) : (
                  tables.map((table, index) => (
                    <tr
                      key={table.id}
                      className="border-b border-white/5 transition hover:bg-white/4 last:border-b-0"
                    >
                      <td className="px-5 py-3 text-center text-[13px] text-crema/35">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex rounded-md border border-saffron/30 bg-saffron/12 px-2.5 py-0.5 text-[12px] font-semibold text-saffron">
                          Table {table.table_number}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => openEdit(table)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-crema/60 transition hover:border-saffron/40 hover:bg-saffron/10 hover:text-saffron"
                          aria-label={`Edit table ${table.table_number}`}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => deleteItem(table.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-crema/60 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                          aria-label={`Delete table ${table.table_number}`}
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

          {tables.length > 0 ? (
            <div className="border-t border-white/8 px-5 py-3">
              <p className="text-[12px] text-crema/30">
                {tables.length} table{tables.length !== 1 ? "s" : ""}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </AdminGuard>
  );
}
