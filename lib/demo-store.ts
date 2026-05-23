import type { CafeOrder, CafeTable, MenuItem } from "@/types/cafe";

export const demoMenuItems: MenuItem[] = [
  {
    id: 1,
    name: "Velvet Cappuccino",
    description: "Double espresso, steamed milk, cocoa dust, and a tight microfoam finish.",
    price: 160,
    category: "Coffee",
    image_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=900&q=80",
    is_available: true,
  },
  {
    id: 2,
    name: "Cold Brew Citrus",
    description: "Slow-steeped arabica over ice with orange peel and a clean tonic sparkle.",
    price: 190,
    category: "Coffee",
    image_url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80",
    is_available: true,
  },
  {
    id: 3,
    name: "Paneer Pesto Panini",
    description: "Grilled paneer, basil pesto, peppers, and melted cheese in toasted focaccia.",
    price: 260,
    category: "Food",
    image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
    is_available: true,
  },
  {
    id: 4,
    name: "Smoky Veggie Burger",
    description: "Spiced patty, lettuce, tomato, cheddar, and house relish on a toasted bun.",
    price: 280,
    category: "Food",
    image_url: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80",
    is_available: true,
  },
  {
    id: 5,
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with a molten center and vanilla cream.",
    price: 220,
    category: "Dessert",
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80",
    is_available: true,
  },
  {
    id: 6,
    name: "Berry Waffle Stack",
    description: "Crisp waffles, berry compote, whipped cream, and maple drizzle.",
    price: 240,
    category: "Dessert",
    image_url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=900&q=80",
    is_available: true,
  },
];

export const demoTables: CafeTable[] = [
  { id: 1, table_number: 1, qr_code_url: null },
  { id: 2, table_number: 2, qr_code_url: null },
  { id: 3, table_number: 3, qr_code_url: null },
  { id: 4, table_number: 4, qr_code_url: null },
];

export const demoOrders: CafeOrder[] = [];

export function makePublicOrder(order: CafeOrder): CafeOrder {
  return {
    id: order.id,
    order_id: order.order_id,
    table_id: order.table_id,
    customer_name: order.customer_name,
    customer_mobile: order.customer_mobile,
    status: order.status,
    payment_status: order.payment_status,
    total_amount: Number(order.total_amount),
    created_at: order.created_at,
    items: order.items,
  };
}
