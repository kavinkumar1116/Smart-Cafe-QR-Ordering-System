export interface QrMenuCategory {
  id: number;
  name: string;
  image_url: string;
  is_available: boolean;
}

export interface QrMenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  is_available: boolean;
}

export interface QrRestaurantDetails {
  id?: number;
  restaurant_name?: string;
  name?: string;
  logo?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  [key: string]: unknown;
}

export interface QrMenuResponse {
  success: boolean;
  restaurantDetails: QrRestaurantDetails | null;
  tableNo: string;
  category: QrMenuCategory[];
  menuItems: QrMenuItem[];
}

export interface QrCartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  quantity: number;
}
