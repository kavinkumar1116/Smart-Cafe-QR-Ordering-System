export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cafe_tables: {
        Row: {
          id: number;
          table_number: number;
          qr_code_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          table_number: number;
          qr_code_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          table_number?: number;
          qr_code_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          image_url: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          price: number | string;
          category: string;
          image_url: string | null;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          price: number;
          category: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          price?: number;
          category?: string;
          image_url?: string | null;
          is_available?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: number;
          order_id: string;
          table_id: number;
          customer_name: string;
          customer_mobile: string;
          status: string;
          payment_status: string;
          billing_method: string | null;
          order_type: string | null;
          total_amount: number | string;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: string;
          table_id: number;
          customer_name: string;
          customer_mobile: string;
          status?: string;
          payment_status?: string;
          billing_method?: string | null;
          order_type?: string | null;
          total_amount: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: string;
          table_id?: number;
          customer_name?: string;
          customer_mobile?: string;
          status?: string;
          payment_status?: string;
          billing_method?: string | null;
          order_type?: string | null;
          total_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey";
            columns: ["table_id"];
            referencedRelation: "cafe_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: number;
          order_id: number;
          menu_item_id: number;
          quantity: number;
          price_at_time: number | string;
        };
        Insert: {
          id?: number;
          order_id: number;
          menu_item_id: number;
          quantity: number;
          price_at_time: number;
        };
        Update: {
          id?: number;
          order_id?: number;
          menu_item_id?: number;
          quantity?: number;
          price_at_time?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
