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
  restaurantName: string;
  branchName: string;
  logo: string;
  address: string;
  contactNumber: string;
  emailAddress: string;
  gstNumber: string;
  gstPercentage: string;
  serviceCharge: string;
  discountRules: string;
  invoicePrefix: string;
  invoiceNumberFormat: string;
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
      <span className="text-xs font-semibold uppercase tracking-wide text-crema/48">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full rounded-lg border border-white/10 bg-espresso px-3 py-3 text-sm text-crema outline-none transition placeholder:text-crema/30 focus:border-saffron"
      />
    </label>
  );
}

function SelectField({ label, defaultValue, options }: SelectProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-crema/48">
        {label}
      </span>

      <select
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-lg border border-white/10 bg-espresso px-3 py-3 text-sm text-crema outline-none transition focus:border-saffron"
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
      className="flex w-full items-center justify-between gap-4 border-b border-white/10 py-3 text-left last:border-b-0"
      aria-pressed={enabled}
    >
      <span>
        <span className="block text-sm font-semibold text-crema">
          {label}
        </span>

        {description ? (
          <span className="mt-1 block text-xs leading-5 text-crema/48">
            {description}
          </span>
        ) : null}
      </span>

      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
          enabled ? "bg-saffron" : "bg-white/14"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-espresso transition ${
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
      className={`scroll-mt-28 rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft sm:p-5 ${
        active ? "block" : "hidden"
      }`}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-saffron text-espresso">
          <Icon size={21} aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-crema">
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
      ? "bg-saffron text-espresso hover:bg-[#f0b556]"
      : tone === "danger"
      ? "border border-berry/40 bg-berry/16 text-crema hover:bg-berry/24"
      : "border border-white/10 bg-white/8 text-crema hover:bg-white/14";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${toneClass}`}
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
    restaurantName: "",
    branchName: "",
    logo: "",
    address: "",
    contactNumber: "",
    emailAddress: "",
    gstNumber: "",
    gstPercentage: "",
    serviceCharge: "",
    discountRules: "",
    invoicePrefix: "",
    invoiceNumberFormat: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Keep form state and global cafe identity in sync for live cross-app updates.
  function updateSettingsField(key: keyof SettingsFormData, value: string) {
    setGetAllFormsData((current) => ({ ...current, [key]: value }));

    if (key === "restaurantName") setRestaurantName(value);
    if (key === "branchName") setBranchName(value);
    if (key === "logo") setLogo(value);
    if (key === "gstNumber") setGstNumber(value);
    if (key === "contactNumber") setContactNumber(value);
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
            restaurantName: data.settings.restaurantName,
            branchName: data.settings.branchName,
            logo: data.settings.logo,
            gstNumber: data.settings.gstNumber,
            contactNumber: data.settings.contactNumber,
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
        <section className="glass-panel rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron text-espresso">
              <Building2 size={20} aria-hidden="true" />
            </div>

            <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">
              Restaurant Settings
            </h2>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-white/10 bg-white/8 p-3 shadow-soft xl:sticky xl:top-24 xl:self-start">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      selected
                        ? "bg-saffron text-espresso"
                        : "text-crema/68 hover:bg-white/10 hover:text-crema"
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
                  value={getAllFormsData.restaurantName}
                  onChange={(value) => updateSettingsField("restaurantName", value)}
                />

                <Field
                  label="Branch Name"
                  value={getAllFormsData.branchName}
                  onChange={(value) => updateSettingsField("branchName", value)}
                />

                <Field
                  label="Address"
                  value={getAllFormsData.address}
                  onChange={(value) => updateSettingsField("address", value)}
                />

                <Field
                  label="Contact Number"
                  value={getAllFormsData.contactNumber}
                  onChange={(value) => updateSettingsField("contactNumber", value)}
                />

                <Field
                  label="Email Address"
                  type="email"
                  value={getAllFormsData.emailAddress}
                  onChange={(value) => updateSettingsField("emailAddress", value)}
                />

                <Field
                  label="GST Number"
                  value={getAllFormsData.gstNumber}
                  onChange={(value) => updateSettingsField("gstNumber", value)}
                />

                <Field
                  label="Logo URL"
                  value={getAllFormsData.logo}
                  placeholder="https://example.com/logo.png"
                  onChange={(value) => updateSettingsField("logo", value)}
                />

                <div className="lg:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-crema/48">
                    Restaurant Logo
                  </span>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-espresso text-saffron">
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
                  value={getAllFormsData.gstPercentage}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      gstPercentage: value,
                    })
                  }
                />

                <Field
                  label="Service Charge"
                  type="number"
                  value={getAllFormsData.serviceCharge}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      serviceCharge: value,
                    })
                  }
                />

                <Field
                  label="Discount Rules"
                  value={getAllFormsData.discountRules}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      discountRules: value,
                    })
                  }
                />

                <Field
                  label="Invoice Prefix"
                  value={getAllFormsData.invoicePrefix}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      invoicePrefix: value,
                    })
                  }
                />

                <Field
                  label="Invoice Number Format"
                  value={getAllFormsData.invoiceNumberFormat}
                  onChange={(value) =>
                    setGetAllFormsData({
                      ...getAllFormsData,
                      invoiceNumberFormat: value,
                    })
                  }
                />
              </div>
            </Panel>

            {/* Save Settings */}
            <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-crema">
                  Save restaurant configuration
                </h2>

                {message ? (
                  <p className="mt-4 rounded-lg bg-white/8 p-3 text-sm text-crema/70">
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
