"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { tenantApiFetch } from "@/lib/tenant";
import { Download, ExternalLink, QrCode } from "lucide-react";
import type { QrCodeRecord, QrCodesResponse } from "@/types/cafe";

export default function AdminQrCodes() {
  const [codes, setCodes] = useState<QrCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCodes() {
      const response = await tenantApiFetch("/api/admin/qr", { cache: "no-store" });
      const data = (await response.json()) as QrCodesResponse;
      setCodes(data.qrCodes || []);
      setLoading(false);
    }
    loadCodes();
  }, []);

  return (
    <AdminGuard>
      <section className="space-y-5">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <QrCode size={25} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600">QR System</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Table QR Codes</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Each QR points customers to a table-specific menu page.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            Generating QR codes...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {codes.map((code) => (
              <article key={code.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <img src={code.qr_code_url} alt={`QR code for table ${code.table_number}`} className="w-full" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Table {code.table_number}</h3>
                <p className="mt-1 truncate text-sm text-slate-500">{code.menu_url}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={code.menu_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Open
                  </a>
                  <a
                    href={code.qr_code_url}
                    download={`table-${code.table_number}-qr.png`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <Download size={16} aria-hidden="true" />
                    Save
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminGuard>
  );
}
