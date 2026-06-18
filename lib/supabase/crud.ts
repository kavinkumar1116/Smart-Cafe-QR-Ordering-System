import type { PostgrestBuilder, PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderReportFilters } from "@/lib/order-report";
import type { BillingMethod, CafeOrder, CafeTable, Category, MenuItem, OrderMode, OrderStatus, PaymentStatus, SessionStatus, CreateNewAccout , CreateSettings} from "@/types/cafe";
import type { Database } from "@/types/database";

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];
type CategoryRow = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name" | "image_url" | "is_available"
>;
type MenuItemInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
type MenuItemUpdate = Database["public"]["Tables"]["menu_items"]["Update"];
type CafeTableInsert = Database["public"]["Tables"]["cafe_tables"]["Insert"];
type CafeTableUpdate = Database["public"]["Tables"]["cafe_tables"]["Update"];
type MenuItemRow = Pick<
  Database["public"]["Tables"]["menu_items"]["Row"],
  "id" | "name" | "description" | "price" | "category" | "image_url" | "is_available"
>;

type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
type PendingOrderItemInsert = Omit<OrderItemInsert, "order_id">;

const categorySelect = "id, name, image_url, is_available";
const menuSelect = "id, name, description, price, category, image_url, is_available";
const orderSelect =
  "id, order_id, table_id, table_number, customer_name, customer_mobile, status, session_status, payment_status, billing_method, order_type, total_amount, created_at";


type CreateNewAccoutInsert = Database["public"]["Tables"]["tenants"]["Insert"];
type CreateNewAccoutUpdate = Database["public"]["Tables"]["tenants"]["Update"];
type TenantCreateSettingsPatch = Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;


function mapSupabaseError(error: PostgrestError): Error {
  return new Error(error.message || "Supabase request failed");
}

function applyTenantFilter(query: any, tenantId?: number) {
  return tenantId ? query.eq("tenant_id", tenantId) : query;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    image_url: row.image_url || "",
    is_available: row.is_available,
    created_at: "",
    updated_at: "", 
  };
}

function mapMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    price: row.price,
    category: row.category,
    image_url: row.image_url || "",
    is_available: row.is_available,
    created_at: "",
    updated_at: "", 
  };
}

function mapOrder(row: Database["public"]["Tables"]["orders"]["Row"]): CafeOrder {
  return {
    id: row.id,
    order_id: row.order_id,
    table_id: row.table_id,
    table_number: row.table_number,
    customer_name: row.customer_name,
    customer_mobile: row.customer_mobile,
    status: row.status as OrderStatus,
    session_status: row.session_status as SessionStatus,
    payment_status: row.payment_status as PaymentStatus,
    billing_method: row.billing_method as BillingMethod | null,
    order_type: row.order_type as OrderMode | null,
    total_amount: row.total_amount,
    created_at: row.created_at,
  };
}

export async function fetchCategories(tenantId?: number): Promise<Category[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(supabase
    .from("categories")
    .select(categorySelect)
    .eq("is_available", true)
    .order("name", { ascending: true }),
    tenantId
  )
  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapCategory);
}

export async function fetchAdminCategories(tenantId?: number): Promise<Category[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(supabase.from("categories" as any).select(categorySelect).order("id", { ascending: false }), tenantId);

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapCategory);
}

export async function insertCategory(category: CategoryInsert, tenantId?: number): Promise<Category> {
  const supabase = createServerSupabaseClient();
  const payload = tenantId ? { ...category, tenant_id: tenantId } : category;
  const { data, error } = await supabase
    .from("categories" as any)
    .insert(payload)
    .select(categorySelect)
    .single();

  if (error) throw mapSupabaseError(error);
  return mapCategory(data as unknown as CategoryRow);
}

export async function updateCategory(id: number, category: CategoryUpdate, tenantId?: number): Promise<Category | null> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("categories" as any).update(category).eq("id", id);
  applyTenantFilter(query, tenantId);
  const { data, error } = await query.select(categorySelect).maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapCategory(data as unknown as CategoryRow) : null;
}

export async function deleteCategory(id: number, tenantId?: number): Promise<void> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("categories" as any).delete().eq("id", id);
  applyTenantFilter(query, tenantId);
  const { error } = await query;
  if (error) throw mapSupabaseError(error);

  if (error) throw mapSupabaseError(error);
}

export async function fetchMenuItems(tenantId?: number): Promise<MenuItem[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(
    supabase
      .from("menu_items" as any)
      .select(menuSelect)
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    tenantId
  );

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapMenuItem);
}

export async function fetchAdminMenuItems(tenantId?: number): Promise<MenuItem[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(supabase.from("menu_items" as any).select(menuSelect).order("id", { ascending: false }), tenantId);

  const { data, error } = await query;

  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapMenuItem);
}

export async function insertMenuItem(item: MenuItemInsert, tenantId?: number): Promise<MenuItem> {
  const supabase = createServerSupabaseClient();
  const payload = tenantId ? { ...item, tenant_id: tenantId } : item;
  const { data, error } = await supabase.from("menu_items" as any).insert(payload).select(menuSelect).single();

  if (error) throw mapSupabaseError(error);
  return mapMenuItem(data as unknown as MenuItemRow);
}

export async function updateMenuItem(id: number, item: MenuItemUpdate, tenantId?: number): Promise<MenuItem | null> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("menu_items" as any).update(item).eq("id", id);
  applyTenantFilter(query, tenantId);
  const { data, error } = await query.select(menuSelect).maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapMenuItem(data as unknown as MenuItemRow) : null;
}

export async function deleteMenuItem(id: number, tenantId?: number): Promise<void> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("menu_items" as any).delete().eq("id", id);
  applyTenantFilter(query, tenantId);
  const { error } = await query;

  if (error) throw mapSupabaseError(error);
}

export async function fetchTables(tenantId?: number): Promise<CafeTable[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(
    supabase.from("cafe_tables" as any).select("id, table_number, qr_code_url").order("table_number", { ascending: true }),
    tenantId
  );
  const { data, error } = await query;

  if (error) throw mapSupabaseError(error);
  return data || [];
}

export async function insertTable(table: CafeTableInsert, tenantId?: number): Promise<CafeTable> {
  const supabase = createServerSupabaseClient();
  const payload = tenantId ? { ...table, tenant_id: tenantId } : table;
  const { data, error } = await supabase
    .from("cafe_tables" as any)
    .insert(payload)
    .select("id, table_number, qr_code_url")
    .single();

  if (error) throw mapSupabaseError(error);
  return data as unknown as CafeTable;
}

export async function updateTable(id: number, table: CafeTableUpdate, tenantId?: number): Promise<CafeTable | null> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("cafe_tables" as any).update(table).eq("id", id);
  applyTenantFilter(query, tenantId);
  const { data, error } = await query.select("id, table_number, qr_code_url").maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? (data as unknown as CafeTable) : null;
}

export async function deleteTable(id: number, tenantId?: number): Promise<void> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("cafe_tables" as any).delete().eq("id", id);
  applyTenantFilter(query, tenantId);
  const { error } = await query;

  if (error) throw mapSupabaseError(error);
}

export async function fetchOrders(tenantId?: number): Promise<CafeOrder[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(supabase.from("orders" as any).select(orderSelect).order("created_at", { ascending: false }), tenantId);

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapOrder);
}

export async function fetchTableByNumber(tableNumber: number, tenantId?: number): Promise<CafeTable | null> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(
    supabase
      .from("cafe_tables" as any)
      .select("id, table_number, qr_code_url")
      .eq("table_number", tableNumber)
      .limit(1),
    tenantId
  );

  const { data, error } = await query.maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data || null;
}

export async function fetchTableById(id: number, tenantId?: number): Promise<CafeTable | null> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(
    supabase
      .from("cafe_tables" as any)
      .select("id, table_number, qr_code_url")
      .eq("id", id)
      .limit(1),
    tenantId
  );

  const { data, error } = await query.maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data || null;
}

export async function fetchOpenOrderByTableNumber(tableNumber: number, tenantId?: number): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(
    supabase
      .from("orders" as any)
      .select(orderSelect)
      .eq("table_number", tableNumber)
      .eq("session_status", "OPEN")
      .eq("payment_status", "Pending")
      .order("created_at", { ascending: false })
      .limit(1),
    tenantId
  );

  const { data, error } = await query.maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data ? mapOrder(data as unknown as Database["public"]["Tables"]["orders"]["Row"]) : null;
}

export async function fetchOrderById(id: string, tenantId?: number): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const numericId = Number(id);
const query = applyTenantFilter(supabase.from("orders" as any).select(orderSelect), tenantId);
  const { data, error } = Number.isFinite(numericId) && numericId > 0
    ? await query.or(`id.eq.${numericId},order_id.eq.${id}`).limit(1).maybeSingle()
    : await query.eq("order_id", id).limit(1).maybeSingle();

  if (error) throw mapSupabaseError(error);
  if (!data) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id, menu_item_id, quantity, price_at_time, menu_items(name, category)")
    .eq("order_id", data.id)
    .order("id", { ascending: true });

  if (itemsError) throw mapSupabaseError(itemsError);

  return {
    ...mapOrder(data as unknown as Database["public"]["Tables"]["orders"]["Row"]),
    items: (items || []).map((item) => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_time: item.price_at_time,
      name: item.menu_items?.name || "Menu item",
      category: item.menu_items?.category || "Cafe",
    })),
  };
}

export async function createOrder(order: OrderInsert, items: PendingOrderItemInsert[], tenantId?: number): Promise<CafeOrder> {
  const supabase = createServerSupabaseClient();
  const payload = tenantId ? { ...order, tenant_id: tenantId } : order;
  const { data, error } = await supabase.from("orders" as any).insert(payload).select(orderSelect).single();

  if (error) throw mapSupabaseError(error);

  const createdOrder = data as unknown as Database["public"]["Tables"]["orders"]["Row"];
  const orderItems = items.map((item) => ({ ...item, order_id: createdOrder.id, tenant_id: tenantId }));
  const { error: itemsError } = await supabase.from("order_items" as any).insert(orderItems);

  if (itemsError) throw mapSupabaseError(itemsError);
  return mapOrder(data as unknown as Database["public"]["Tables"]["orders"]["Row"]);
}

export async function appendOrderItems(
  orderId: number,
  items: PendingOrderItemInsert[],
  orderPatch: OrderUpdate,
  tenantId?: number
): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const orderItems = items.map((item) => ({ ...item, order_id: orderId, tenant_id: tenantId }));

  const { error: itemsError } = await supabase.from("order_items" as any).insert(orderItems);
  if (itemsError) throw mapSupabaseError(itemsError);

  const query = supabase.from("orders" as any).update(orderPatch).eq("id", orderId);
  applyTenantFilter(query, tenantId);
  const { data, error } = await query.select(orderSelect).maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapOrder(data as unknown as Database["public"]["Tables"]["orders"]["Row"]) : null;
}

export async function updateOrderStatus(
  id: number,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  billingMethod?: BillingMethod,
  tenantId?: number
): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("orders" as any).update({
    ...(status ? { status } : {}),
    ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    ...(paymentStatus === "Paid" ? { session_status: "CLOSED" } : {}),
    ...(billingMethod ? { billing_method: billingMethod } : {}),
  }).eq("id", id);
  applyTenantFilter(query, tenantId);

  const { data, error } = await query.select(orderSelect).maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data ? mapOrder(data as unknown as Database["public"]["Tables"]["orders"]["Row"]) : null;
}


export async function fetchAdminSalesReports(tenantId?: number): Promise<any[]> {
  const supabase = createServerSupabaseClient();
  const query = applyTenantFilter(supabase.from("orders" as any).select("id, order_id, table_number, total_amount,order_type, created_at").order("created_at", { ascending: false }), tenantId);
  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data || [];
}

export async function getRestaurantDetails(tenantId?: number): Promise<any[]> {
  const supabase = createServerSupabaseClient();
  const query = supabase.from("app_settings" as any)
    .select("id, restaurant_name, logo_url, address").select("id, restaurant_name, logo_url, address").order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data || [];
}

export async function getOrderSalesReportByDate( tenantId?: number, order_type: string = "", date: string = "",invoice_no: string = ""
): Promise<any[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase.from("orders" as any).select("id, order_id, table_number, total_amount, order_type, created_at");

  if (order_type) {
    query = query.eq("order_type", order_type);
  }

  if (date) {
    query = query.gte("created_at", `${date}T00:00:00`).lt("created_at", `${date}T23:59:59`);
  }

  if (invoice_no) {
    query = query.or(`order_id.eq.${invoice_no},order_id.eq.${invoice_no}`);
  }

  query = applyTenantFilter(query.order("created_at", { ascending: false }),tenantId );

  const { data, error } = await query;

  if (error) throw mapSupabaseError(error);

  return data || [];
}

type OrderReportItemRow = {
  quantity: number;
  price_at_time: number | string;
};

type OrderReportQueryRow = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items?: OrderReportItemRow[] | null;
};

export async function fetchOrderReports(
  tenantId?: number,
  filters: OrderReportFilters = {}
): Promise<CafeOrder[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("orders" as any)
    .select(`${orderSelect}, order_items(quantity, price_at_time)`);

  if (filters.date_from) {
    query = query.gte("created_at", `${filters.date_from}T00:00:00`);
  }

  if (filters.date_to) {
    query = query.lt("created_at", `${filters.date_to}T23:59:59.999`);
  }

  if (filters.status) {
    if (filters.status === "Completed") {
      query = query.eq("status", "Served");
    } else if (filters.status === "Pending") {
      query = query.in("status", ["Pending", "Preparing", "Ready"]);
    } else if (filters.status === "Cancelled") {
      query = query.eq("status", "Cancelled");
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters.table_number) {
    query = query.eq("table_number", Number(filters.table_number));
  }

  if (filters.payment_method) {
    query = query.eq("billing_method", filters.payment_method);
  }

  if (filters.customer_name?.trim()) {
    query = query.ilike("customer_name", `%${filters.customer_name.trim()}%`);
  }

  if (filters.order_type) {
    query = query.eq("order_type", filters.order_type);
  }

  query = applyTenantFilter(
    query.order("created_at", { ascending: false }),
    tenantId
  );

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);

  return ((data || []) as unknown as OrderReportQueryRow[]).map((row) => {
    const order = mapOrder(row);
    const items = (row.order_items || []).map((item, index) => ({
      id: index + 1,
      menu_item_id: 0,
      name: "",
      quantity: item.quantity,
      price_at_time: item.price_at_time,
    }));

    return { ...order, items };
  });
}

export async function insertCreateNewAccout(item: CreateNewAccoutInsert): Promise<CreateNewAccout> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tenants")
    .insert({ ...item, reset_otp: null, reset_otp_expiry: null } as any)
    .select("tenant_id, tenant_slug, tenant_name, owner_name, email, password_hash, phone, subscription_plan, status, cafe_name, brand, branch, outlet_type, tables, address, city, pincode, state, whatsapp, designation, gst, fssai, created_at, updated_at")
    .single();

  if (error) throw mapSupabaseError(error);
  return data as CreateNewAccout;
}

export async function fetchTenantsByEmail(email: string): Promise<CreateNewAccout[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("tenant_id, tenant_slug,tenant_name,owner_name,email, password_hash,phone,subscription_plan, status, cafe_name, brand, branch, outlet_type, tables, address, city, pincode,  state,  whatsapp,designation,  gst, fssai, reset_otp, reset_otp_expiry, created_at, updated_at")
    .eq("email", email.trim())
    .order("created_at", { ascending: true });

  if (error) throw mapSupabaseError(error);
  return data as CreateNewAccout[];
}

export async function fetchTenantsByTenantID(tenantId: number): Promise<CreateNewAccout[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) throw mapSupabaseError(error);
  return data as CreateNewAccout[];
}

export async function updateTenantBranch(tenantId: number, item: Partial<CreateNewAccout>): Promise<CreateNewAccout> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tenants")
    .update(item as any)  // ← cast here once, all call sites stay clean
    .eq("tenant_id", tenantId)
    .select("tenant_id, tenant_slug, tenant_name, owner_name, email, phone, subscription_plan, status, cafe_name, brand, branch, outlet_type, tables, address, city, pincode, state, whatsapp, designation, gst, fssai, created_at, updated_at")
    .single();

  if (error) throw mapSupabaseError(error);
  return data as CreateNewAccout;
}

export async function insertTenantResetOtp(
  tenantId: number,
  reset_otp: string,
  reset_otp_expiry: string
): Promise<CreateNewAccout> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tenants")
    .update({ reset_otp, reset_otp_expiry } as CreateNewAccoutUpdate)
    .eq("tenant_id", tenantId)
    .select();  // ← remove .maybeSingle() temporarily
 

  if (error) throw mapSupabaseError(error);
  if (!data || data.length === 0) throw new Error(`No tenant found with id: ${tenantId}`);

  return data[0] as CreateNewAccout;
}

export async function updateForgotPassword(
  tenantId: number,
  password_hash: string,
): Promise<CreateNewAccout> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tenants")
    .update({ reset_otp: null, reset_otp_expiry: null, password_hash } as any)
    .eq("tenant_id", tenantId)
    .select();

  if (error) throw mapSupabaseError(error);
  if (!data || data.length === 0) throw new Error(`No tenant found with id: ${tenantId}`);

  return data[0] as CreateNewAccout;
}

export async function insertCreateSettings(item: TenantCreateSettingsPatch): Promise<CreateSettings> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("app_settings" )
    .insert({ ...item } as any)
    .select("id, tenant_id, restaurant_name, branch_name, logo_url, address, contact_number, email, gst_number, gst_percentage, service_charge, discount_rules, invoice_prefix, invoice_number_format")
    .single();

  if (error) throw mapSupabaseError(error);
  return data as CreateSettings;
}