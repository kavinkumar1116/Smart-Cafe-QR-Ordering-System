export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: number;
          tenant_id: number;
          restaurant_name: string;
          branch_name: string;
          logo_url: string;
          address: string;
          contact_number: string;
          email: string;
          gst_number: string;
          gst_percentage: number;
          service_charge: number;
          discount_rules: string;
          invoice_prefix: string;
          invoice_number_format: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: number;
          tenant_id: number;
          restaurant_name: string;
          branch_name: string;
          logo_url: string;
          address: string;
          contact_number: string;
          email: string;
          gst_number: string;
          gst_percentage: number;
          service_charge: number;
          discount_rules: string;
          invoice_prefix: string;
          invoice_number_format: string;
          created_at: string;
          updated_at: string | null;
        };
        Update: {
          id: number;
          tenant_id: number;
          restaurant_name: string;
          branch_name: string;
          logo_url: string;
          address: string;
          contact_number: string;
          email: string;
          gst_number: string;
          gst_percentage: number;
          service_charge: number;
          discount_rules: string;
          invoice_prefix: string;
          invoice_number_format: string;
          created_at: string;
          updated_at: string | null;
        };
        Relationships: [];
      };
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
          table_number: number | null;
          customer_name: string;
          customer_mobile: string;
          status: string;
          session_status: string;
          payment_status: string;
          billing_method: string | null;
          order_type: string | null;
          total_amount: number | string;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: string;
          table_id: number | null;
          table_number?: number | null;
          customer_name: string;
          customer_mobile: string;
          status?: string;
          session_status?: string;
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
          table_number?: number | null;
          customer_name?: string;
          customer_mobile?: string;
          status?: string;
          session_status?: string;
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
      stores: {
        Row: {
          id: number;
          name: string;
          slug: string;
          owner_user_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          slug: string;
          owner_user_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          slug?: string;
          owner_user_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: number;
          store_id: number;
          name: string;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          store_id: number;
          name: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          store_id?: number;
          name?: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "branches_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          id: number;
          store_id: number | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          store_id?: number | null;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          store_id?: number | null;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          id: number;
          role_id: number;
          permission: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          role_id: number;
          permission: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          role_id?: number;
          permission?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: number;
          user_id: string;
          role_id: number;
          store_id: number | null;
          branch_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          role_id: number;
          store_id?: number | null;
          branch_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          role_id?: number;
          store_id?: number | null;
          branch_id?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          tenant_id: number;
          parent_tenant_id: number | null;
          is_head_branch: boolean;
          tenant_slug: string | null;
          tenant_name: string | null;

          owner_name: string;
          email: string;
          password_hash: string;
          phone: string;

          subscription_plan: string | null;
          status: number;

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

          reset_otp: string | null;
          reset_otp_expiry: string | null;

          created_at: string;
          updated_at: string;
        };

        Insert: {
          tenant_id?: number;
          parent_tenant_id?: number | null;
          is_head_branch: boolean;
          tenant_slug?: string | null;
          tenant_name?: string | null;

          owner_name: string;
          email: string;
          password_hash: string;
          phone: string;

          subscription_plan?: string | null;
          status?: number;

          cafe_name: string;
          brand?: string | null;
          branch: string;

          outlet_type: string;
          tables: string;

          address: string;
          city: string;
          pincode: string;
          state: string;

          whatsapp?: string | null;
          designation?: string | null;

          gst?: string | null;
          fssai?: string | null;

          trial_start_date?: string | null;
          trial_end_date?: string | null;

          reset_otp: string | null;
          reset_otp_expiry: string | null;

          created_at?: string;
          updated_at?: string;
        };

        Update: {
          tenant_id?: number;
          parent_tenant_id?: number | null;
          is_head_branch: boolean;
          tenant_slug?: string | null;
          tenant_name?: string | null;

          owner_name?: string;
          email?: string;
          password_hash?: string;
          phone?: string;

          subscription_plan?: string | null;
          status?: number;

          cafe_name?: string;
          brand?: string | null;
          branch?: string;

          outlet_type?: string;
          tables?: string;

          address?: string;
          city?: string;
          pincode?: string;
          state?: string;

          whatsapp?: string | null;
          designation?: string | null;

          gst?: string | null;
          fssai?: string | null;

          trial_start_date?: string | null;
          trial_end_date?: string | null;

          reset_otp: string | null;
          reset_otp_expiry: string | null;

          updated_at?: string;
        };

        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: number;
          tenant_id: number;
          plan_name: string;
          plan_code: string;
          next_billing_cycle: string | null;
          amount: number | null;
          gst_percentage: number | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          payment_status: boolean;
          transaction_id: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          created_at: string;
          updated_at: string;
        };

        Insert: {
          id?: number;
          tenant_id: number;
          plan_name: string;
          plan_code: string;
          next_billing_cycle?: string | null;
          amount?: number | null;
          gst_percentage?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          payment_status?: boolean;
          transaction_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };

        Update: {
          id?: number;
          tenant_id?: number;
          plan_name?: string;
          plan_code?: string;
          next_billing_cycle?: string | null;
          amount?: number | null;
          gst_percentage?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          payment_status?: boolean;
          transaction_id?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          created_at?: string;
          updated_at?: string;
        };

        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: number;
          tenant_id: number;
          plan_name: string;
          plan_code: string;
          monthly_price: number;
          yearly_price: number;
          max_tables: number;
          trial_days: string | null;
          is_active: number | null;
          created_at: string;
          updated_at: string;
        };

        Insert: {
          id?: number;
          tenant_id: number;
          plan_name: string;
          plan_code: string;
          monthly_price: number;
          yearly_price: number;
          max_tables: number;
          trial_days: string | null;
          is_active: number | null;
          created_at: string;
          updated_at: string;
        };

        Update: {
          id?: number;
          tenant_id: number;
          plan_name: string;
          plan_code: string;
          monthly_price: number;
          yearly_price: number;
          max_tables: number;
          trial_days: string | null;
          is_active: number | null;
          created_at: string;
          updated_at: string;
        };

        Relationships: [];
      };
      required_fields: {
        Row: {
          id: number;
          value: string;
          label: string;
        };

        Insert: {
          id?: number;
          value: string;
          label: string;
        };

        Update: {
          id?: number;
          value?: string;
          label?: string;
        };
        Relationships: [];
      }
      required_field_data: {
        Row: {
          id: number;
          tenant_id: number;
          required_field_id: number;
          checked:number;
        };

        Insert: {
          id: number;
          tenant_id: number;
          required_field_id: number;
          checked:number;
        };

        Update: {
          id: number;
          tenant_id: number;
          required_field_id: number;
          checked:number;
        };
        Relationships: [];
      }
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
