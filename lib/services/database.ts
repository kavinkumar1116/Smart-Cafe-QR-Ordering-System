import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  createOrder,
  deleteCategory,
  deleteMenuItem,
  fetchAdminCategories,
  fetchAdminMenuItems,
  fetchMenuItems,
  fetchOrderById,
  fetchOrders,
  fetchTables,
  insertCategory,
  insertMenuItem,
  updateCategory,
  updateMenuItem,
  updateOrderStatus,
} from "@/lib/supabase/crud";

export const database = {
  supabase: createServerSupabaseClient,
  categories: {
    list: fetchAdminCategories,
    create: insertCategory,
    update: updateCategory,
    delete: deleteCategory,
  },
  menu: {
    list: fetchAdminMenuItems,
    listAvailable: fetchMenuItems,
    create: insertMenuItem,
    update: updateMenuItem,
    delete: deleteMenuItem,
  },
  orders: {
    list: fetchOrders,
    get: fetchOrderById,
    create: createOrder,
    updateStatus: updateOrderStatus,
  },
  tables: {
    list: fetchTables,
  },
};
