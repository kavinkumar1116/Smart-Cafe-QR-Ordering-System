"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { useCafeStore } from "@/src/store/useCafeStore";
import { tenantApiFetch } from "@/lib/tenant";
import { useRef, useMemo } from "react";
import {
  Building2,
  CheckCircle2,
  ReceiptText,
  Trash2,
  Upload,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { uploadCafeLogo } from "@/lib/supabase/storage";

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

interface RequiredFormData {
  id: number;
  label: string;
  value: string;
  checked?: number | null;
}

interface RequiredSaveFormData {
  id: number;
  tenant_id: string;
  required_field_id: string;
  checked?: number | null;
}
interface BranchFormData {
  tenant_id?: number;
  branch_name: string;
  phone: string;
  email: string;
  password?: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  status: boolean;
  admin_email: string;
  admin_password: string;
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
  readOnly?: boolean;
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
  readOnly = false,
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
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
        className="mt-2 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${enabled ? "bg-emerald-600" : "bg-slate-200"
          }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? "translate-x-5" : "translate-x-0"
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
      className={`scroll-mt-28 rounded-[5px] border border-slate-200 bg-white p-5 shadow-sm ${active ? "block" : "hidden"
        }`}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-emerald-600 text-white">
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
      className={`inline-flex items-center justify-center gap-2 rounded-[5px] px-3 py-2 text-sm font-semibold transition ${toneClass} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </button>
  );
}


export default function AdminSettings() {
  const isHeadBranch = useCafeStore((state) => state.isHeadBranch); // ✅ inside component

  const sections: SettingsSection[] = useMemo(() => {
    const base: SettingsSection[] = [
      { id: "general", title: "General Settings", icon: Building2 },
      { id: "billing", title: "Billing & Tax Settings", icon: ReceiptText },
      { id: "setRequiredFields", title: "Set Required Fields", icon: ReceiptText },
    ];

    if (isHeadBranch) {
      base.push({ id: "create_branches", title: "Create Branches", icon: Building2 });
    }

    return base;
  }, [isHeadBranch]);

  // ... rest of your existing state

  const [activeSection, setActiveSection] = useState(sections[0].id);
  const setRestaurantName = useCafeStore((state) => state.setRestaurantName);
  const setBranchName = useCafeStore((state) => state.setBranchName);
  const setLogo = useCafeStore((state) => state.setLogo);
  const setGstNumber = useCafeStore((state) => state.setGstNumber);
  const setContactNumber = useCafeStore((state) => state.setContactNumber);
  const setCafeProfile = useCafeStore((state) => state.setCafeProfile);
  const tenantId = useCafeStore((state) => state.tenantId);

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

  const [branches, setBranches] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [branchForm, setBranchForm] = useState<BranchFormData>({
    branch_name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
    status: true,
    admin_email: "",
    admin_password: "",
  });
  const [getRequiredFields, setGetRequiredFields] = useState<RequiredFormData[]>([]);
  const [getRequiredSavedFields, setGetRequiredSavedFields] = useState<RequiredSaveFormData[]>([]);
  console.log("getRequiredSavedFields====", getRequiredSavedFields)

  async function loadBranches() {
    setBranchesLoading(true);
    setBranchesError("");
    try {
      const response = await tenantApiFetch("/api/admin/branches");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load branches");
      }
      setBranches(data.branches || []);
    } catch (err) {
      setBranchesError(err instanceof Error ? err.message : "Error loading branches");
    } finally {
      setBranchesLoading(false);
    }
  }

  useEffect(() => {
    if (activeSection === "create_branches") {
      void loadBranches();
    }
  }, [activeSection]);

  async function saveBranch(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const isEdit = !!editingBranch;
      const response = await tenantApiFetch("/api/admin/branches", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? {
          tenant_id: editingBranch.tenant_id,
          branch_name: branchForm.branch_name,
          phone: branchForm.phone,
          email: branchForm.email,
          address: branchForm.address,
          city: branchForm.city,
          pincode: branchForm.pincode,
          state: branchForm.state,
          status: branchForm.status,
        } : {
          branch_name: branchForm.branch_name,
          phone: branchForm.phone,
          email: branchForm.email,
          password: branchForm.password,
          address: branchForm.address,
          city: branchForm.city,
          pincode: branchForm.pincode,
          state: branchForm.state,
          status: branchForm.status,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save branch");
      }

      setModalOpen(false);
      void loadBranches();
      setMessage(isEdit ? "Branch updated successfully." : "Branch created successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save branch.");
    } finally {
      setSaving(false);
    }
  }

  const [getNewBranchesFormsData, setGetNewBranchesFormsData] = useState({
    branch_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    status: "",
    exisitng_email_id: "",
    exisitng_password: "",
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
          getRequiredFieldsData?: Array<RequiredFormData>;
          getRequiredFieldsSavedData?: Array<RequiredSaveFormData>;
          error?: string;
          detail?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.error || data.detail || "Unable to load settings."
          );
        }
        if (data.getRequiredFieldsData) {
          setGetRequiredFields(
            data.getRequiredFieldsData.map((item) => ({
              ...item
            }))
          );
        }
        if (data.getRequiredFieldsSavedData) {
          setGetRequiredSavedFields(
            data.getRequiredFieldsSavedData.map((item) => ({
              ...item
            }))
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;
    setLogoFile(file);
    setSelectedFileName(file.name);
    console.log("Selected File:", file);

    // Upload to Supabase Storage here
    // uploadLogo(file);
  };

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      let logoUrl = getAllFormsData.logo_url;

      if (logoFile) {
        logoUrl = await uploadCafeLogo(logoFile, "cafe_logo", tenantId);
      }
      console.log("logoUrl", logoUrl);
      const response = await tenantApiFetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            ...getAllFormsData,
            logo_url: logoUrl,
          },
          requiredFields: getRequiredFields.map((field) => {
            const saved = getRequiredSavedFields.find(
              (s) => Number(s?.required_field_id) === Number(field.id)
            );
            return {
              required_field_id: field.id,
              checked: saved?.checked ? 1 : 0,
            };
          }),
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
        <section className="rounded-[5px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-emerald-600 text-white">
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
          <aside className="rounded-[5px] border border-slate-200 bg-white p-3 shadow-sm xl:sticky xl:top-24 xl:self-start">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-3 rounded-[5px] px-3 py-3 text-left text-sm font-semibold transition ${selected
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
                  readOnly={true}
                  onChange={(value) => updateSettingsField("email_address", value)}
                />

                <Field
                  label="GST Number"
                  value={getAllFormsData.gst_number}
                  onChange={(value) => updateSettingsField("gst_number", value)}
                />

                <div className="lg:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Restaurant Logo
                  </span>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[5px] border border-slate-200 bg-slate-50 text-emerald-600">
                      <Utensils size={24} aria-hidden="true" />
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

            {/* Required Fields Settings */}
            <Panel
              {...sections[2]}
              active={activeSection === sections[2].id}
            >
              <div className="overflow-x-auto rounded-[5px] border border-slate-200 bg-white">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Si.No</th>
                      <th className="px-5 py-3.5 font-semibold">Field Name</th>
                      <th className="px-5 py-3.5 font-semibold">Required</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {getRequiredFields.map((field, index) => (
                      <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-600">{index + 1}</td>
                        <td className="px-5 py-3.5 text-slate-600">{field.label}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <label className="inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={
                                getRequiredSavedFields.find(
                                  (value) => Number(value.required_field_id) === Number(field.id)
                                )?.checked === 1
                              }
                              onChange={(e) => {
                                const isChecked = e.target.checked ? 1 : 0;
                                const fieldId = field.id;
                                setGetRequiredSavedFields((prev) => {
                                  const existingIndex = prev.findIndex(
                                    (item) => Number(item.required_field_id) === Number(fieldId)
                                  );
                                  if (existingIndex > -1) {
                                    const updated = [...prev];
                                    updated[existingIndex] = {
                                      ...updated[existingIndex],
                                      checked: isChecked,
                                    };
                                    return updated;
                                  } else {
                                    return [
                                      ...prev,
                                      {
                                        id: 0,
                                        tenant_id: String(tenantId),
                                        required_field_id: String(fieldId),
                                        checked: isChecked,
                                      },
                                    ];
                                  }
                                });
                              }}
                              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* Create Branches */}
            {isHeadBranch && sections[3] && (
              <Panel
                {...sections[3]}
                active={activeSection === sections[3].id}
              >
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Branches List
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Manage cafe locations and statuses</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranch(null);
                      setMessage("");
                      setBranchForm({
                        branch_name: "",
                        phone: "",
                        email: "",
                        password: "",
                        address: "",
                        city: "",
                        pincode: "",
                        state: "",
                        status: true,
                        admin_email: "",
                        admin_password: "",
                      });
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-[5px] bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                  >
                    Create New Branch
                  </button>
                </div>

                {branchesLoading ? (
                  <div className="text-sm text-slate-500 py-6 text-center">Loading branches...</div>
                ) : branchesError ? (
                  <div className="text-sm text-rose-500 py-6 text-center">{branchesError}</div>
                ) : branches.length === 0 ? (
                  <div className="text-sm text-slate-500 py-10 text-center border border-dashed border-slate-200 rounded-[5px] bg-slate-50/50">
                    No branches created yet. Click "Create New Branch" to add one.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[5px] border border-slate-200 bg-white">
                    <table className="w-full border-collapse text-left text-sm text-slate-500">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                        <tr>
                          <th className="px-5 py-3.5 font-semibold">Branch Name</th>
                          <th className="px-5 py-3.5 font-semibold">Tenant ID</th>
                          <th className="px-5 py-3.5 font-semibold">Email</th>
                          <th className="px-5 py-3.5 font-semibold">Location</th>
                          <th className="px-5 py-3.5 font-semibold">Phone</th>
                          <th className="px-5 py-3.5 font-semibold">Status</th>
                          <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {branches.map((b) => (
                          <tr key={b.tenant_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-slate-900">{b.branch}</td>
                            <td className="px-5 py-3.5 text-slate-600">{b.tenant_slug}</td>
                            <td className="px-5 py-3.5 text-slate-600">{b.email}</td>
                            <td className="px-5 py-3.5 text-slate-500">
                              {b.city ? `${b.city}, ${b.state || ""}` : "-"}
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">{b.phone}</td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${b.status === 1 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                                }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${b.status === 1 ? "bg-emerald-500" : "bg-slate-400"
                                  }`} />
                                {b.status === 1 ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBranch(b);
                                  setMessage("");
                                  setBranchForm({
                                    branch_name: b.branch || "",
                                    phone: b.phone || "",
                                    email: b.email || "",
                                    password: "",
                                    address: b.address || "",
                                    city: b.city || "",
                                    pincode: b.pincode || "",
                                    state: b.state || "",
                                    status: b.status === 1,
                                    admin_email: b.admin_email || "",
                                    admin_password: "",
                                  });
                                  setModalOpen(true);
                                }}
                                className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            )}

            {/* Save Settings */}
            <section className="flex flex-col gap-3 rounded-[5px] border border-slate-200 bg-slate-50 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Save restaurant configuration
                </h2>

                {message ? (
                  <p className="mt-4 rounded-[5px] bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
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

        {/* Modal Popup */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-lg rounded border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editingBranch ? "Edit Cafe Branch" : "Create New Cafe Branch"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-[5px] p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={saveBranch} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Branch Name"
                    value={branchForm.branch_name}
                    placeholder="e.g. Indiranagar Branch"
                    onChange={(val) => setBranchForm({ ...branchForm, branch_name: val })}
                  />
                  <Field
                    label="Phone Number"
                    value={branchForm.phone}
                    placeholder="Phone Number"
                    onChange={(val) => setBranchForm({ ...branchForm, phone: val })}
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Address"
                      value={branchForm.address}
                      placeholder="Shop no, building, street..."
                      onChange={(val) => setBranchForm({ ...branchForm, address: val })}
                    />
                  </div>
                  <Field
                    label="City"
                    value={branchForm.city}
                    placeholder="e.g. Bengaluru"
                    onChange={(val) => setBranchForm({ ...branchForm, city: val })}
                  />
                  <Field
                    label="Pincode"
                    value={branchForm.pincode}
                    placeholder="6-digit PIN code"
                    onChange={(val) => setBranchForm({ ...branchForm, pincode: val })}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="State"
                      value={branchForm.state}
                      placeholder="e.g. Karnataka"
                      onChange={(val) => setBranchForm({ ...branchForm, state: val })}
                    />
                  </div>
                  <Field
                    label="Email Address"
                    type="email"
                    value={branchForm.email}
                    placeholder="e.g. indiranagar@cafe.com"
                    onChange={(val) => setBranchForm({ ...branchForm, email: val })}
                  />
                  {!editingBranch && (
                    <Field
                      label="Login Password"
                      type="password"
                      value={branchForm.password}
                      placeholder="Set account login password"
                      onChange={(val) => setBranchForm({ ...branchForm, password: val })}
                    />
                  )}

                  {activeSection !== "create_branches" && (
                    <div className="sm:col-span-2 py-2 border-t border-b border-slate-100 my-1">
                      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Branch Activation Status
                      </span>
                      <Toggle
                        label="Branch Active"
                        description="When disabled, customers cannot order from this location"
                        enabled={branchForm.status}
                        onChange={() =>
                          setBranchForm({
                            ...branchForm,
                            status: !branchForm.status,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-[5px] border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-[5px] bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 shadow-sm"
                  >
                    {saving ? "Saving..." : "Save Branch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
