"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useCafeStore } from "@/src/store/useCafeStore";
import { tenantApiFetch } from "@/lib/tenant";
import {
  Building2,
  CheckCircle2,
  ReceiptText,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ToggleKey = "roundOff" | "splitBilling" | "tips" | "autoBillPrint";

interface SettingsFormData {
  restaurant_name: string;
  branch_name: string;
  logo_url: string;
  address: string;
  contact_number: string;
  email_address: string;
  gst_number: string;
  gst_percentage: string;
  service_charge: string;
  discount_rules: string;
  invoice_prefix: string;
  invoice_number_format: string;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: LucideIcon;
}

interface PanelProps extends SettingsSection {
  active?: boolean;
  children: React.ReactNode;
}

interface InputProps {
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
  onChange?: (value: string) => void;
}

interface SelectProps {
  label: string;
  defaultValue: string;
  options: string[];
}

interface ToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: () => void;
}

const sections: SettingsSection[] = [
  {
    id: "general",
    title: "General Settings",
    icon: Building2,
  },
  {
    id: "billing",
    title: "Billing & Tax Settings",
    icon: ReceiptText,
  },
];

const initialToggles: Record<ToggleKey, boolean> = {
  roundOff: true,
  splitBilling: true,
  tips: false,
  autoBillPrint: true,
};

function Field({
  label,
  value = "",
  placeholder = "",
  type = "text",
  onChange,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      />
    </label>
  );
}

function SelectField({ label, defaultValue, options }: SelectProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  description,
  enabled,
  onChange,
}: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 border-b border-slate-200 py-3 text-left last:border-b-0 hover:bg-slate-50 transition"
      aria-pressed={enabled}
    >
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {label}
        </span>

        {description ? (
          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
          enabled ? "bg-emerald-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function Panel({
  id,
  title,
  icon: Icon,
  active = true,
  children,
}: PanelProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
        active ? "block" : "hidden"
      }`}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Icon size={21} aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
        </div>
      </div>

      {children}
    </section>
  );
}

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

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const setRestaurantName = useCafeStore((state) => state.setRestaurantName);
  const setBranchName = useCafeStore((state) => state.setBranchName);
  const setLogo = useCafeStore((state) => state.setLogo);
  const setGstNumber = useCafeStore((state) => state.setGstNumber);
  const setContactNumber = useCafeStore((state) => state.setContactNumber);
  const setCafeProfile = useCafeStore((state) => state.setCafeProfile);

  const [getAllFormsData, setGetAllFormsData] = useState<SettingsFormData>({
    restaurant_name: "",
    branch_name: "",
    logo_url: "",
    address: "",
    contact_number: "",
    email_address: "",
    gst_number: "",
    gst_percentage: "",
    service_charge: "",
    discount_rules: "",
    invoice_prefix: "",
    invoice_number_format: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Keep form state and global cafe identity in sync for live cross-app updates.
  function updateSettingsField(key: keyof SettingsFormData, value: string) {
    setGetAllFormsData((current) => ({ ...current, [key]: value }));

    if (key === "restaurant_name") setRestaurantName(value);
    if (key === "branch_name") setBranchName(value);
    if (key === "logo_url") setLogo(value);
    if (key === "gst_number") setGstNumber(value);
    if (key === "contact_number") setContactNumber(value);
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await tenantApiFetch("/api/admin/settings", {
          cache: "no-store",
        });

        const data = (await response.json()) as {
          settings?: Partial<SettingsFormData>;
          error?: string;
          detail?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error || data.detail || "Unable to load settings."
          );
        }

        if (data.settings) {
          setGetAllFormsData((current) => ({ ...current, ...data.settings }));
          setCafeProfile({
            restaurantName: data.settings.restaurant_name,
            branchName: data.settings.branch_name,
            logo: data.settings.logo_url,
            gstNumber: data.settings.gst_number,
            contactNumber: data.settings.contact_number,
          });
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load settings."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const response = await tenantApiFetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: getAllFormsData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.detail || "Unable to save settings."
        );
      }

      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGuard>
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Building2 size={20} aria-hidden="true" />
            </div>

            <div>
              <p className="text-sm font-medium text-emerald-600">Settings</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Restaurant Settings
              </h2>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-24 xl:self-start">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      selected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={17} aria-hidden="true" />

                    <span className="min-w-0 flex-1 truncate">
                      {section.title.replace(" Settings", "")}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-5">
            {/* General Settings */}
            <Panel
              {...sections[0]}
              active={activeSection === sections[0].id}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <Field
                  label="Restaurant Name"
                  value={getAllFormsData.restaurant_name}
                  onChange={(value) => updateSettingsField("restaurant_name", value)}
                />

                <Field
                  label="Branch Name"
                  value={getAllFormsData.branch_name}
                  onChange={(value) => updateSettingsField("branch_name", value)}
                />

                <Field
                  label="Address"
                  value={getAllFormsData.address}
                  onChange={(value) => updateSettingsField("address", value)}
                />

                <Field
                  label="Contact Number"
                  value={getAllFormsData.contact_number}
                  onChange={(value) => updateSettingsField("contact_number", value)}
                />

                <Field
                  label="Email Address"
                  type="email"
                  value={getAllFormsData.email_address}
                  onChange={(value) => updateSettingsField("email_address", value)}
                />

                <Field
                  label="GST Number"
                  value={getAllFormsData.gst_number}
                  onChange={(value) => updateSettingsField("gst_number", value)}
                />

                <Field
                  label="Logo URL"
                  value={getAllFormsData.logo_url}
                  placeholder="https://example.com/logo.png"
                  onChange={(value) => updateSettingsField("logo_url", value)}
                />

                <div className="lg:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Restaurant Logo
                  </span>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-emerald-600">
                      <Utensils size={24} aria-hidden="true" />
                    </div>

                    <ActionButton
                      label="Upload Logo"
                      icon={Upload}
                    />

                    <ActionButton
                      label="Remove"
                      icon={Trash2}
                      tone="danger"
                    />
                  </div>
                </div>
              </div>
            </Panel>

            {/* Billing Settings */}
            <Panel
              {...sections[1]}
              active={activeSection === sections[1].id}
            >
              <div className="grid gap-4 lg:grid-cols-3">
                <Field
                  label="GST / Tax Percentage"
                  type="number"
                  value={getAllFormsData.gst_percentage}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      gst_percentage: value,
                    })
                  }
                />

                <Field
                  label="Service Charge"
                  type="number"
                  value={getAllFormsData.service_charge}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      service_charge: value,
                    })
                  }
                />

                <Field
                  label="Discount Rules"
                  value={getAllFormsData.discount_rules}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      discount_rules: value,
                    })
                  }
                />

                <Field
                  label="Invoice Prefix"
                  value={getAllFormsData.invoice_prefix}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      invoice_prefix: value,
                    })
                  }
                />

                <Field
                  label="Invoice Number Format"
                  value={getAllFormsData.invoice_number_format}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      invoice_number_format: value,
                    })
                  }
                />
              </div>
            </Panel>

            {/* Save Settings */}
            <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Save restaurant configuration
                </h2>

                {message ? (
                  <p className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    {message}
                  </p>
                ) : null}
              </div>

              <ActionButton
                label={saving ? "Saving..." : "Save Settings"}
                icon={CheckCircle2}
                tone="primary"
                onClick={saveSettings}
                disabled={saving || loading}
              />
            </section>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
