"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { Download, ExternalLink, QrCode } from "lucide-react";
import type { QrCodeRecord, QrCodesResponse } from "@/types/cafe";

export default function AdminQrCodes() {
  const [codes, setCodes] = useState<QrCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCodes() {
      const response = await fetch("/api/admin/qr", { cache: "no-store" });
      const data = (await response.json()) as QrCodesResponse;
      setCodes(data.qrCodes || []);
      setLoading(false);
    }
    loadCodes();
  }, []);

  return (
    <AdminGuard>
      <section className="space-y-5">
        <div className="glass-panel rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-saffron text-espresso">
              <QrCode size={25} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-saffron">QR System</p>
              <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Table QR Codes</h2>
              <p className="mt-2 text-sm leading-6 text-crema/62">
                Each QR points customers to a table-specific menu page.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-white/10 bg-white/8 p-8 text-center text-crema/70">
            Generating QR codes...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {codes.map((code) => (
              <article key={code.id} className="rounded-lg border border-white/10 bg-white/8 p-4">
                <div className="rounded-lg bg-crema p-4">
                  <img src={code.qr_code_url} alt={`QR code for table ${code.table_number}`} className="w-full" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-crema">Table {code.table_number}</h3>
                <p className="mt-1 truncate text-sm text-crema/52">{code.menu_url}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={code.menu_url}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 py-2 text-sm font-semibold text-crema"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    Open
                  </a>
                  <a
                    href={code.qr_code_url}
                    download={`table-${code.table_number}-qr.png`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron px-3 py-2 text-sm font-semibold text-espresso"
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
