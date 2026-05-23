"use client";

import { useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import {
  BarChart3,
  Bell,
  Building2,
  ChefHat,
  CheckCircle2,
  Clock3,
  CreditCard,
  KeyRound,
  Mail,
  MessageCircle,
  Network,
  Palette,
  Percent,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  UsersRound,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ToggleKey =
  | "roundOff"
  | "splitBilling"
  | "tips"
  | "autoBillPrint"
  | "cash"
  | "upi"
  | "card"
  | "wallet"
  | "autoTable"
  | "mobileRequired"
  | "nameRequired"
  | "selfOrdering"
  | "dineIn"
  | "takeaway"
  | "autoConfirm"
  | "foodAvailability"
  | "vegLabels"
  | "comboMeals"
  | "addons"
  | "dynamicPricing"
  | "happyHour"
  | "kds"
  | "orderSound"
  | "kitchenPrint"
  | "liveStatus"
  | "priority"
  | "readyControl"
  | "whatsapp"
  | "sms"
  | "email"
  | "readyAlerts"
  | "paymentAlerts"
  | "push"
  | "razorpay"
  | "stripe"
  | "paytm"
  | "phonepe"
  | "googlePay"
  | "upiQr"
  | "thermalPrinter"
  | "billPrinter"
  | "theme"
  | "darkMode"
  | "mobileLayout"
  | "bannerSlider"
  | "loyalty"
  | "coupon"
  | "feedback"
  | "dailyReport"
  | "monthlyRevenue"
  | "orderedItems"
  | "staffPerformance"
  | "tableOccupancy"
  | "gstReports"
  | "exports"
  | "twoFactor"
  | "activityLogs"
  | "backup"
  | "apiKeys"
  | "branchManagement"
  | "trialManagement"
  | "featureAccess"
  | "tenantSettings"
  | "customBranding";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface PanelProps extends SettingsSection {
  children: React.ReactNode;
}

interface InputProps {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
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
    description: "Restaurant identity, branch profile, regional defaults",
    icon: Building2,
  },
  {
    id: "billing",
    title: "Billing & Tax Settings",
    description: "GST, invoice rules, billing behavior",
    icon: ReceiptText,
  },
  {
    id: "payments",
    title: "Payment Methods",
    description: "Cash, card, UPI, wallets, payment gateways",
    icon: CreditCard,
  },
  {
    id: "qr",
    title: "QR Ordering Settings",
    description: "Table QR flow, customer details, order confirmation",
    icon: QrCode,
  },
  {
    id: "menu",
    title: "Menu Management Settings",
    description: "Categories, food items, labels, pricing",
    icon: Utensils,
  },
  {
    id: "kitchen",
    title: "Kitchen Settings",
    description: "KDS, tickets, sections, order status control",
    icon: ChefHat,
  },
  {
    id: "staff",
    title: "User & Staff Management",
    description: "Accounts, roles, permissions, shifts",
    icon: UsersRound,
  },
  {
    id: "notifications",
    title: "Notification Settings",
    description: "WhatsApp, SMS, email, push alerts",
    icon: Bell,
  },
  {
    id: "integrations",
    title: "Payment Integration Settings",
    description: "Razorpay, Stripe, Paytm, PhonePe, Google Pay",
    icon: Smartphone,
  },
  {
    id: "printers",
    title: "Printer Settings",
    description: "Thermal, kitchen, bill printers, templates",
    icon: Printer,
  },
  {
    id: "experience",
    title: "Customer Experience Settings",
    description: "Theme, mobile layout, coupons, loyalty, feedback",
    icon: Palette,
  },
  {
    id: "reports",
    title: "Analytics & Reports",
    description: "Sales, GST, occupancy, exports",
    icon: BarChart3,
  },
  {
    id: "security",
    title: "Security Settings",
    description: "Passwords, sessions, activity logs, backups",
    icon: ShieldCheck,
  },
  {
    id: "saas",
    title: "SaaS Multi-Restaurant Settings",
    description: "Branches, subscriptions, tenant controls",
    icon: Network,
  },
];

const initialToggles: Record<ToggleKey, boolean> = {
  roundOff: true,
  splitBilling: true,
  tips: false,
  autoBillPrint: true,
  cash: true,
  upi: true,
  card: true,
  wallet: false,
  autoTable: true,
  mobileRequired: true,
  nameRequired: false,
  selfOrdering: true,
  dineIn: true,
  takeaway: true,
  autoConfirm: false,
  foodAvailability: true,
  vegLabels: true,
  comboMeals: true,
  addons: true,
  dynamicPricing: false,
  happyHour: true,
  kds: true,
  orderSound: true,
  kitchenPrint: true,
  liveStatus: true,
  priority: true,
  readyControl: true,
  whatsapp: true,
  sms: false,
  email: true,
  readyAlerts: true,
  paymentAlerts: true,
  push: true,
  razorpay: true,
  stripe: false,
  paytm: false,
  phonepe: true,
  googlePay: true,
  upiQr: true,
  thermalPrinter: true,
  billPrinter: true,
  theme: true,
  darkMode: true,
  mobileLayout: true,
  bannerSlider: true,
  loyalty: true,
  coupon: true,
  feedback: true,
  dailyReport: true,
  monthlyRevenue: true,
  orderedItems: true,
  staffPerformance: true,
  tableOccupancy: true,
  gstReports: true,
  exports: true,
  twoFactor: false,
  activityLogs: true,
  backup: true,
  apiKeys: true,
  branchManagement: true,
  trialManagement: true,
  featureAccess: true,
  tenantSettings: true,
  customBranding: true,
};

function Field({ label, defaultValue = "", placeholder = "", type = "text" }: InputProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-crema/48">{label}</span>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-white/10 bg-espresso px-3 py-3 text-sm text-crema outline-none transition placeholder:text-crema/30 focus:border-saffron"
      />
    </label>
  );
}

function SelectField({ label, defaultValue, options }: SelectProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-crema/48">{label}</span>
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

function Toggle({ label, description, enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 border-b border-white/10 py-3 text-left last:border-b-0"
      aria-pressed={enabled}
    >
      <span>
        <span className="block text-sm font-semibold text-crema">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-crema/48">{description}</span> : null}
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

function Panel({ id, title, description, icon: Icon, children }: PanelProps) {
  return (
    <section id={id} className="scroll-mt-28 rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-saffron text-espresso">
          <Icon size={21} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-crema">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-crema/52">{description}</p>
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
}: {
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "secondary" | "danger";
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${toneClass}`}
    >
      <Icon size={16} aria-hidden="true" />
      {label}
    </button>
  );
}

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [toggles, setToggles] = useState(initialToggles);

  const enabledCount = useMemo(
    () => Object.values(toggles).filter(Boolean).length,
    [toggles]
  );

  function flip(key: ToggleKey) {
    setToggles((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <AdminGuard>
      <div className="space-y-5">
        <section className="glass-panel rounded-lg p-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-saffron text-espresso">
                <Building2 size={31} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-saffron">Operations Control</p>
                <h2 className="mt-1 text-2xl font-semibold text-crema sm:text-3xl">Restaurant Settings</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-crema/62">
                  Configure identity, QR ordering, billing, kitchen flow, staff access, notifications, payments,
                  reports, security, and multi-branch controls from one admin workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-lg border border-white/10 bg-black/12 px-4 py-3">
                <p className="text-xs text-crema/48">Sections</p>
                <p className="mt-1 text-2xl font-semibold text-crema">{sections.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/12 px-4 py-3">
                <p className="text-xs text-crema/48">Enabled Controls</p>
                <p className="mt-1 text-2xl font-semibold text-crema">{enabledCount}</p>
              </div>
              <ActionButton label="Save Settings" icon={Save} tone="primary" />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-white/10 bg-white/8 p-3 shadow-soft xl:sticky xl:top-24 xl:self-start">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;

                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      selected ? "bg-saffron text-espresso" : "text-crema/68 hover:bg-white/10 hover:text-crema"
                    }`}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{section.title.replace(" Settings", "")}</span>
                  </a>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-5">
            <Panel {...sections[0]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Restaurant Name" defaultValue="Smart Cafe" />
                <Field label="Tagline / Slogan" defaultValue="Fresh orders, faster billing" />
                <Field label="Branch Name" defaultValue="Central Cafe" />
                <Field label="Address" defaultValue="MG Road, Bengaluru" />
                <Field label="Contact Number" defaultValue="+91 98765 43210" />
                <Field label="Email Address" defaultValue="admin@smartcafe.in" type="email" />
                <Field label="GST Number" defaultValue="29ABCDE1234F1Z5" />
                <SelectField label="Currency Settings" defaultValue="INR - Indian Rupee" options={["INR - Indian Rupee", "USD - US Dollar", "AED - UAE Dirham"]} />
                <SelectField label="Time Zone" defaultValue="Asia/Kolkata" options={["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York"]} />
                <SelectField label="Language Selection" defaultValue="English" options={["English", "Hindi", "Kannada", "Tamil"]} />
                <div className="lg:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-crema/48">Restaurant Logo</span>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-espresso text-saffron">
                      <Utensils size={24} aria-hidden="true" />
                    </div>
                    <ActionButton label="Upload Logo" icon={Upload} />
                    <ActionButton label="Remove" icon={Trash2} tone="danger" />
                  </div>
                </div>
              </div>
            </Panel>

            <Panel {...sections[1]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="GST / Tax Percentage" defaultValue="5" type="number" />
                <Field label="Service Charge" defaultValue="8" type="number" />
                <Field label="Discount Rules" defaultValue="Max 15% manager approval" />
                <Field label="Invoice Prefix" defaultValue="SCF" />
                <SelectField label="Invoice Number Format" defaultValue="SCF-YYYY-0001" options={["SCF-YYYY-0001", "SCF-MM-0001", "BRANCH-0001"]} />
                <SelectField label="Tip Settings" defaultValue="Optional at checkout" options={["Optional at checkout", "Fixed percentage", "Disabled"]} />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Round Off Settings" description="Round final payable value to the nearest rupee." enabled={toggles.roundOff} onChange={() => flip("roundOff")} />
                <Toggle label="Split Billing" description="Allow table bills to be split by item or amount." enabled={toggles.splitBilling} onChange={() => flip("splitBilling")} />
                <Toggle label="Tip Collection" description="Show tip options before payment confirmation." enabled={toggles.tips} onChange={() => flip("tips")} />
                <Toggle label="Auto Bill Print" description="Print invoices automatically after payment." enabled={toggles.autoBillPrint} onChange={() => flip("autoBillPrint")} />
              </div>
            </Panel>

            <Panel {...sections[2]}>
              <div className="grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Cash" enabled={toggles.cash} onChange={() => flip("cash")} />
                <Toggle label="UPI" enabled={toggles.upi} onChange={() => flip("upi")} />
                <Toggle label="Card" enabled={toggles.card} onChange={() => flip("card")} />
                <Toggle label="Wallet" enabled={toggles.wallet} onChange={() => flip("wallet")} />
              </div>
            </Panel>

            <Panel {...sections[3]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="QR Table Number Management" defaultValue="1-24 active tables" />
                <SelectField label="Default Order Mode" defaultValue="Dine-in and Takeaway" options={["Dine-in and Takeaway", "Dine-in only", "Takeaway only"]} />
                <Field label="Confirmation Time Limit" defaultValue="90 seconds" />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Auto Table Assignment" enabled={toggles.autoTable} onChange={() => flip("autoTable")} />
                <Toggle label="Customer Mobile Required" enabled={toggles.mobileRequired} onChange={() => flip("mobileRequired")} />
                <Toggle label="Customer Name Required" enabled={toggles.nameRequired} onChange={() => flip("nameRequired")} />
                <Toggle label="Self Ordering" enabled={toggles.selfOrdering} onChange={() => flip("selfOrdering")} />
                <Toggle label="Dine-in" enabled={toggles.dineIn} onChange={() => flip("dineIn")} />
                <Toggle label="Takeaway" enabled={toggles.takeaway} onChange={() => flip("takeaway")} />
                <Toggle label="Auto Order Confirmation" enabled={toggles.autoConfirm} onChange={() => flip("autoConfirm")} />
              </div>
            </Panel>

            <Panel {...sections[4]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Category Management" defaultValue="Beverages, Snacks, Combos" />
                <Field label="Food Preparation Time" defaultValue="18 minutes average" />
                <SelectField label="Default Item Label" defaultValue="Veg / Non-Veg visible" options={["Veg / Non-Veg visible", "Only veg labels", "Labels hidden"]} />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Add / Edit / Delete Food Items" enabled={toggles.foodAvailability} onChange={() => flip("foodAvailability")} />
                <Toggle label="Food Availability Toggle" enabled={toggles.foodAvailability} onChange={() => flip("foodAvailability")} />
                <Toggle label="Veg / Non-Veg Labels" enabled={toggles.vegLabels} onChange={() => flip("vegLabels")} />
                <Toggle label="Combo Meal Settings" enabled={toggles.comboMeals} onChange={() => flip("comboMeals")} />
                <Toggle label="Add-ons & Extras" enabled={toggles.addons} onChange={() => flip("addons")} />
                <Toggle label="Dynamic Pricing" enabled={toggles.dynamicPricing} onChange={() => flip("dynamicPricing")} />
                <Toggle label="Happy Hour Pricing" enabled={toggles.happyHour} onChange={() => flip("happyHour")} />
              </div>
            </Panel>

            <Panel {...sections[5]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <SelectField label="Kitchen Section Assignment" defaultValue="Beverage / Hot Kitchen / Dessert" options={["Beverage / Hot Kitchen / Dessert", "Single kitchen", "Counter-wise routing"]} />
                <SelectField label="Cooking Priority" defaultValue="Rush orders first" options={["Rush orders first", "FIFO", "VIP tables first"]} />
                <SelectField label="Ready / Preparing Status Control" defaultValue="Kitchen can update" options={["Kitchen can update", "Admin only", "Cashier and kitchen"]} />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Kitchen Display System (KDS)" enabled={toggles.kds} onChange={() => flip("kds")} />
                <Toggle label="Order Sound Notification" enabled={toggles.orderSound} onChange={() => flip("orderSound")} />
                <Toggle label="Auto Print Kitchen Tickets" enabled={toggles.kitchenPrint} onChange={() => flip("kitchenPrint")} />
                <Toggle label="Live Order Status" enabled={toggles.liveStatus} onChange={() => flip("liveStatus")} />
                <Toggle label="Cooking Priority" enabled={toggles.priority} onChange={() => flip("priority")} />
                <Toggle label="Ready / Preparing Status Control" enabled={toggles.readyControl} onChange={() => flip("readyControl")} />
              </div>
            </Panel>

            <Panel {...sections[6]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Admin Accounts" defaultValue="2 users" />
                <Field label="Cashier Accounts" defaultValue="4 users" />
                <Field label="Waiter Accounts" defaultValue="8 users" />
                <Field label="Kitchen Staff Accounts" defaultValue="6 users" />
                <SelectField label="Role-Based Access Control" defaultValue="Enabled by role" options={["Enabled by role", "Custom per user", "Simple admin/staff"]} />
                <SelectField label="Shift Management" defaultValue="Morning / Evening" options={["Morning / Evening", "Three shifts", "Custom schedule"]} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton label="Add Staff" icon={Plus} tone="primary" />
                <ActionButton label="Staff Permissions" icon={KeyRound} />
              </div>
            </Panel>

            <Panel {...sections[7]}>
              <div className="grid gap-x-6 lg:grid-cols-2">
                <Toggle label="WhatsApp Notifications" enabled={toggles.whatsapp} onChange={() => flip("whatsapp")} />
                <Toggle label="SMS Notifications" enabled={toggles.sms} onChange={() => flip("sms")} />
                <Toggle label="Email Notifications" enabled={toggles.email} onChange={() => flip("email")} />
                <Toggle label="Order Ready Alerts" enabled={toggles.readyAlerts} onChange={() => flip("readyAlerts")} />
                <Toggle label="Payment Success Alerts" enabled={toggles.paymentAlerts} onChange={() => flip("paymentAlerts")} />
                <Toggle label="Admin Push Notifications" enabled={toggles.push} onChange={() => flip("push")} />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Field label="WhatsApp Sender" defaultValue="+91 98765 43210" />
                <Field label="SMS Template ID" defaultValue="SC_ORDER_READY" />
                <Field label="Email From Address" defaultValue="billing@smartcafe.in" />
              </div>
            </Panel>

            <Panel {...sections[8]}>
              <div className="grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Razorpay" enabled={toggles.razorpay} onChange={() => flip("razorpay")} />
                <Toggle label="Stripe" enabled={toggles.stripe} onChange={() => flip("stripe")} />
                <Toggle label="Paytm" enabled={toggles.paytm} onChange={() => flip("paytm")} />
                <Toggle label="PhonePe" enabled={toggles.phonepe} onChange={() => flip("phonepe")} />
                <Toggle label="Google Pay" enabled={toggles.googlePay} onChange={() => flip("googlePay")} />
                <Toggle label="UPI QR" enabled={toggles.upiQr} onChange={() => flip("upiQr")} />
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <Field label="Razorpay Key ID" defaultValue="rzp_live_xxxxx" />
                <Field label="UPI VPA" defaultValue="smartcafe@upi" />
                <Field label="Webhook Secret" placeholder="Add secret key" />
              </div>
            </Panel>

            <Panel {...sections[9]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Thermal Printer Setup" defaultValue="80mm ESC/POS" />
                <Field label="Kitchen Printer" defaultValue="Kitchen Counter 1" />
                <Field label="Bill Printer" defaultValue="Cashier Desk" />
                <SelectField label="Print Template Design" defaultValue="Compact GST bill" options={["Compact GST bill", "Detailed invoice", "Kitchen ticket"]} />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Thermal Printer" enabled={toggles.thermalPrinter} onChange={() => flip("thermalPrinter")} />
                <Toggle label="Auto Print Toggle" enabled={toggles.autoBillPrint} onChange={() => flip("autoBillPrint")} />
                <Toggle label="Kitchen Printer" enabled={toggles.kitchenPrint} onChange={() => flip("kitchenPrint")} />
                <Toggle label="Bill Printer" enabled={toggles.billPrinter} onChange={() => flip("billPrinter")} />
              </div>
            </Panel>

            <Panel {...sections[10]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <SelectField label="Theme Customization" defaultValue="Smart Cafe Classic" options={["Smart Cafe Classic", "Minimal Light", "High Contrast"]} />
                <SelectField label="Mobile Layout Settings" defaultValue="Compact menu first" options={["Compact menu first", "Category first", "Offers first"]} />
                <Field label="Loyalty Points" defaultValue="1 point per Rs. 100" />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Theme Customization" enabled={toggles.theme} onChange={() => flip("theme")} />
                <Toggle label="Dark / Light Mode" enabled={toggles.darkMode} onChange={() => flip("darkMode")} />
                <Toggle label="Mobile Layout Settings" enabled={toggles.mobileLayout} onChange={() => flip("mobileLayout")} />
                <Toggle label="Banner Sliders" enabled={toggles.bannerSlider} onChange={() => flip("bannerSlider")} />
                <Toggle label="Loyalty Points" enabled={toggles.loyalty} onChange={() => flip("loyalty")} />
                <Toggle label="Coupon System" enabled={toggles.coupon} onChange={() => flip("coupon")} />
                <Toggle label="Feedback & Ratings" enabled={toggles.feedback} onChange={() => flip("feedback")} />
              </div>
            </Panel>

            <Panel {...sections[11]}>
              <div className="grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Daily Sales Report" enabled={toggles.dailyReport} onChange={() => flip("dailyReport")} />
                <Toggle label="Monthly Revenue" enabled={toggles.monthlyRevenue} onChange={() => flip("monthlyRevenue")} />
                <Toggle label="Most Ordered Items" enabled={toggles.orderedItems} onChange={() => flip("orderedItems")} />
                <Toggle label="Staff Performance" enabled={toggles.staffPerformance} onChange={() => flip("staffPerformance")} />
                <Toggle label="Table Occupancy" enabled={toggles.tableOccupancy} onChange={() => flip("tableOccupancy")} />
                <Toggle label="GST Reports" enabled={toggles.gstReports} onChange={() => flip("gstReports")} />
                <Toggle label="Export Excel / PDF" enabled={toggles.exports} onChange={() => flip("exports")} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton label="Export Excel" icon={BarChart3} />
                <ActionButton label="Export PDF" icon={ReceiptText} />
              </div>
            </Panel>

            <Panel {...sections[12]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Change Password" placeholder="New password" type="password" />
                <SelectField label="Login Session Timeout" defaultValue="8 hours" options={["30 minutes", "2 hours", "8 hours", "24 hours"]} />
                <Field label="API Keys" defaultValue="2 active keys" />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Two-Factor Authentication" enabled={toggles.twoFactor} onChange={() => flip("twoFactor")} />
                <Toggle label="Activity Logs" enabled={toggles.activityLogs} onChange={() => flip("activityLogs")} />
                <Toggle label="Data Backup" enabled={toggles.backup} onChange={() => flip("backup")} />
                <Toggle label="API Keys" enabled={toggles.apiKeys} onChange={() => flip("apiKeys")} />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton label="Change Password" icon={KeyRound} />
                <ActionButton label="View Activity Logs" icon={Clock3} />
              </div>
            </Panel>

            <Panel {...sections[13]}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Branch Management" defaultValue="3 active branches" />
                <SelectField label="Subscription Plans" defaultValue="Professional" options={["Starter", "Professional", "Enterprise"]} />
                <Field label="Trial Management" defaultValue="14 days remaining" />
                <SelectField label="Tenant Settings" defaultValue="Per branch configuration" options={["Per branch configuration", "Central configuration", "Hybrid"]} />
              </div>
              <div className="mt-5 grid gap-x-6 lg:grid-cols-2">
                <Toggle label="Branch Management" enabled={toggles.branchManagement} onChange={() => flip("branchManagement")} />
                <Toggle label="Trial Management" enabled={toggles.trialManagement} onChange={() => flip("trialManagement")} />
                <Toggle label="Feature Access Control" enabled={toggles.featureAccess} onChange={() => flip("featureAccess")} />
                <Toggle label="Tenant Settings" enabled={toggles.tenantSettings} onChange={() => flip("tenantSettings")} />
                <Toggle label="Custom Branding" enabled={toggles.customBranding} onChange={() => flip("customBranding")} />
              </div>
            </Panel>

            <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/8 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-crema">Save restaurant configuration</h2>
                <p className="mt-1 text-sm text-crema/52">Apply the latest billing, ordering, kitchen, and access settings.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionButton label="Send Test Alert" icon={MessageCircle} />
                <ActionButton label="Email Summary" icon={Mail} />
                <ActionButton label="Save Settings" icon={CheckCircle2} tone="primary" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
