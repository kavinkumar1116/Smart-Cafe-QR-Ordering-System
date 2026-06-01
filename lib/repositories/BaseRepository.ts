import type { PostgrestBuilder } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TenantAuditPayload = {
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  is_active?: boolean;
  tenant_id?: number;
};

export class BaseRepository {
  protected client = createServerSupabaseClient();

  constructor(protected tenantId: number | null, protected currentUserId?: string | null) {}

  protected scoped(table: string): any {
    const query = this.client.from(table as any) as any;
    if (this.tenantId) {
      query.eq("tenant_id", this.tenantId);
      query.eq("is_deleted", false);
    }
    return query;
  }

  protected attachTenantData<T extends Record<string, unknown>>(payload: T): T & TenantAuditPayload {
    const now = new Date().toISOString();
    return {
      ...payload,
      tenant_id: this.tenantId ?? undefined,
      created_by: this.currentUserId ?? null,
      updated_by: this.currentUserId ?? null,
      created_at: now,
      updated_at: now,
      is_deleted: false,
      is_active: true,
    } as T & TenantAuditPayload;
  }

  select(table: string, columns = "*") {
    return this.scoped(table).select(columns);
  }

  insert(table: string, payload: Record<string, unknown>) {
    return this.client.from(table as any).insert(this.attachTenantData(payload));
  }

  update(table: string, id: number, payload: Record<string, unknown>) {
    return this.client
      .from(table as any)
      .update({ ...payload, updated_by: this.currentUserId ?? null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", this.tenantId);
  }

  softDelete(table: string, id: number) {
    return this.client
      .from(table as any)
      .update({ is_deleted: true, updated_by: this.currentUserId ?? null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", this.tenantId);
  }
}
