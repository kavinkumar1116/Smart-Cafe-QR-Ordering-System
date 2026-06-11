import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "Served" | "Paid" | "Cancelled";
export type PaymentStatus = "Pending" | "Paid" | "Cancelled";
export type BillingMethod = "UPI" | "Cash";
export type OrderMode = "Dine-In" | "Takeaway" | "Delivery";
export type SessionStatus = "OPEN" | "CLOSED";
export type NumericValue = number | string;


export interface Category {
  id: number;
  name: string;  
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: NumericValue;
  category: string;
  image_url: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  quantity: number;
  table_id: number;
}

export interface CustomerDetails {
  customer_name: string;
  customer_mobile: string;
  table_id: number | string;
  table_number?: number | string;
}

export interface OrderItem {
  id?: number;
  menu_item_id: number;
  name: string;
  category?: string;
  quantity: number;
  price_at_time: NumericValue;
}

export interface CafeOrder {
  id: number;
  order_id: string;
  table_id: number;
  table_number?: number | null;
  customer_name: string;
  customer_mobile: string;
  status: OrderStatus;
  session_status?: SessionStatus;
  payment_status: PaymentStatus;
  billing_method?: BillingMethod | null;
  order_type?: OrderMode | null;
  total_amount: NumericValue;
  created_at: string;
  items?: OrderItem[];
  branch?: string;
  mode?: OrderMode;
}

export interface DashboardOrder extends Omit<CafeOrder, "id"> {
  id: number | string;
  branch: string;
  mode: OrderMode;
}

export interface CafeTable {
  id: number;
  table_number: number;
  qr_code_url: string | null;
}

export interface TableForm {
  id: number | null;
  table_number: string;
}

export interface QrCodeRecord extends CafeTable {
  menu_url: string;
  qr_code_url: string;
}

export interface ApiErrorResponse {
  error?: string;
  detail?: string;
}

export interface MenuResponse extends ApiErrorResponse {
  items?: MenuItem[];
}

export interface OrdersResponse extends ApiErrorResponse {
  orders?: CafeOrder[];
}

export interface OrderResponse extends ApiErrorResponse {
  order?: CafeOrder;
}

export interface QrCodesResponse extends ApiErrorResponse {
  qrCodes?: QrCodeRecord[];
}

export interface QrMenuResponse {
  success: boolean;
  tableNo?: string;
  category?: Category[];
  menuItems?: MenuItem[];
  message?: string;
  detail?: string;
}

export interface AdminMenuForm {
  id: number | null;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  is_available: boolean;
}

export interface CategoryForm {
  id: number | null;
  name: string;
  image_url: string;
  is_available: boolean;
}

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DayBucket extends ChartDatum {
  date: Date;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CustomRange {
  from: string;
  to: string;
}

export interface NavChildItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  children?: NavChildItem[];
}

export interface ShellProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
}

export interface CreateNewAccout {
  tenant_id: number;
  tenant_slug: string | null;
  tenant_name: string | null;

  owner_name: string;
  email: string;
  phone: string;

  subscription_plan: string | null;

  status: number; // <-- change from string to number

  cafe_name: string;
  brand: string | null;
  branch: string;

  outlet_type: string;
  tables: string;

  address: string;
  city: string;
  pincode: string;
  state: string;

  whatsapp: string | null;
  designation: string | null;

  gst: string | null;
  fssai: string | null;

  created_at: string;
  updated_at: string;
}
