import type { PostgrestError } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BillingMethod, CafeOrder, CafeTable, Category, MenuItem, OrderMode, OrderStatus, PaymentStatus, SessionStatus } from "@/types/cafe";
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

function mapSupabaseError(error: PostgrestError): Error {
  return new Error(error.message || "Supabase request failed");
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

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapCategory);
}

export async function fetchAdminCategories(): Promise<Category[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("categories").select(categorySelect).order("id", {
    ascending: false,
  });

  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapCategory);
}

export async function insertCategory(category: CategoryInsert): Promise<Category> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select(categorySelect)
    .single();

  if (error) throw mapSupabaseError(error);
  return mapCategory(data);
}

export async function updateCategory(id: number, category: CategoryUpdate): Promise<Category | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .update(category)
    .eq("id", id)
    .select(categorySelect)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapCategory(data) : null;
}

export async function deleteCategory(id: number): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw mapSupabaseError(error);
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(menuSelect)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapMenuItem);
}

export async function fetchAdminMenuItems(): Promise<MenuItem[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("menu_items").select(menuSelect).order("id", {
    ascending: false,
  });

  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapMenuItem);
}

export async function insertMenuItem(item: MenuItemInsert): Promise<MenuItem> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("menu_items").insert(item).select(menuSelect).single();

  if (error) throw mapSupabaseError(error);
  return mapMenuItem(data);
}

export async function updateMenuItem(id: number, item: MenuItemUpdate): Promise<MenuItem | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update(item)
    .eq("id", id)
    .select(menuSelect)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapMenuItem(data) : null;
}

export async function deleteMenuItem(id: number): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) throw mapSupabaseError(error);
}

export async function fetchTables(): Promise<CafeTable[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .select("id, table_number, qr_code_url")
    .order("table_number", { ascending: true });

  if (error) throw mapSupabaseError(error);
  return data || [];
}

export async function insertTable(table: CafeTableInsert): Promise<CafeTable> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .insert(table)
    .select("id, table_number, qr_code_url")
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateTable(id: number, table: CafeTableUpdate): Promise<CafeTable | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .update(table)
    .eq("id", id)
    .select("id, table_number, qr_code_url")
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data || null;
}

export async function deleteTable(id: number): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("cafe_tables").delete().eq("id", id);

  if (error) throw mapSupabaseError(error);
}

export async function fetchOrders(): Promise<CafeOrder[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("orders").select(orderSelect).order("created_at", {
    ascending: false,
  });

  if (error) throw mapSupabaseError(error);
  return (data || []).map(mapOrder);
}

export async function fetchTableByNumber(tableNumber: number): Promise<CafeTable | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .select("id, table_number, qr_code_url")
    .eq("table_number", tableNumber)
    .limit(1)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data || null;
}

export async function fetchTableById(id: number): Promise<CafeTable | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cafe_tables")
    .select("id, table_number, qr_code_url")
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data || null;
}

export async function fetchOpenOrderByTableNumber(tableNumber: number): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(orderSelect)
    .eq("table_number", tableNumber)
    .eq("session_status", "OPEN")
    .eq("payment_status", "Pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapOrder(data) : null;
}

export async function fetchOrderById(id: string): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const numericId = Number(id);
  const query = supabase.from("orders").select(orderSelect);
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
    ...mapOrder(data),
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

export async function createOrder(order: OrderInsert, items: PendingOrderItemInsert[]): Promise<CafeOrder> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("orders").insert(order).select(orderSelect).single();

  if (error) throw mapSupabaseError(error);

  const orderItems = items.map((item) => ({ ...item, order_id: data.id }));
  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) throw mapSupabaseError(itemsError);
  return mapOrder(data);
}

export async function appendOrderItems(
  orderId: number,
  items: PendingOrderItemInsert[],
  orderPatch: OrderUpdate
): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const orderItems = items.map((item) => ({ ...item, order_id: orderId }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) throw mapSupabaseError(itemsError);

  const { data, error } = await supabase
    .from("orders")
    .update(orderPatch)
    .eq("id", orderId)
    .select(orderSelect)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapOrder(data) : null;
}

export async function updateOrderStatus(
  id: number,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  billingMethod?: BillingMethod
): Promise<CafeOrder | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      ...(status ? { status } : {}),
      ...(paymentStatus ? { payment_status: paymentStatus } : {}),
      ...(paymentStatus === "Paid" ? { session_status: "CLOSED" } : {}),
      ...(billingMethod ? { billing_method: billingMethod } : {}),
    })
    .eq("id", id)
    .select(orderSelect)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data ? mapOrder(data) : null;
}
