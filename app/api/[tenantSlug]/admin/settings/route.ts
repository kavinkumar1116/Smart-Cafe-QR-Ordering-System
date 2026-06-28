import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { fetchTenantsDataByTenantID, fetchSubcriptionsByTenant } from "@/lib/supabase/crud";

type SettingsRecord = {
  tenant_id?: number;
  restaurant_name?: string | null;
  branch_name?: string | null;
  logo_url?: string | null;
  address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  email_address?: string | null;
  gst_number?: string | null;
  gst_percentage?: number | string | null;
  service_charge?: number | string | null;
  discount_rules?: string | null;
  invoice_prefix?: string | null;
  invoice_number_format?: string | null;
};

function normalizeSettings(record: SettingsRecord | null) {
  return {
    tenant_id: record?.tenant_id ?? 0,
    restaurant_name: record?.restaurant_name ?? "",
    branch_name: record?.branch_name ?? "",
    logo_url: record?.logo_url ?? "",
    address: record?.address ?? "",
    contact_number: record?.contact_number ?? "",
    email_address: record?.email_address ?? record?.email ?? "",
    gst_number: record?.gst_number ?? "",
    gst_percentage:
      record?.gst_percentage == null ? "" : String(record.gst_percentage),
    service_charge:
      record?.service_charge == null ? "" : String(record.service_charge),
    discount_rules: record?.discount_rules ?? "",
    invoice_prefix: record?.invoice_prefix ?? "",
    invoice_number_format: record?.invoice_number_format ?? "",
  };
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("app_settings" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw error;

    const settingsRecord = data as SettingsRecord | null;

    const getStoreData = await fetchTenantsDataByTenantID(tenantId);
    const invoicesData = await fetchSubcriptionsByTenant(tenantId);

    const invoice = invoicesData?.[0];

    let subscriptionExpiringMessage = "";
    let subscriptionStatus = "Active";

    if (!invoice) {
      subscriptionStatus = "Expired";
    }

    if (invoice?.end_date) {
      const expiryDate = new Date(invoice.end_date);
      const today = new Date();
      if (today > expiryDate) {
        subscriptionStatus = "Expired";
      }
       else {
        subscriptionStatus = "Active";
      }
      // Remove time part for accurate day comparison
      expiryDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const remainingDays = Math.ceil(
        (expiryDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
      );

      if (remainingDays <= 2 && remainingDays >= 0) {
        subscriptionExpiringMessage = `Your subscription expires on ${expiryDate
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
          .replace(/ /g, "-")}`;
      }
    }

    return NextResponse.json({
      settings: normalizeSettings(settingsRecord),
      getStoreData,
      invoicesData: invoicesData || [],
      subscriptionExpiringMessage,
      subscriptionStatus,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load settings",
        detail: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const body = await request.json();

    const settings = body.settings || {};

    console.log("Received settings to save:", settings);

    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("app_settings" as any)
      .upsert(
        {
          tenant_id: tenantId,
          restaurant_name: settings.restaurant_name ?? "",
          branch_name: settings.branch_name ?? "",
          logo_url: settings.logo_url ?? "",
          address: settings.address ?? "",
          contact_number: settings.contact_number ?? "",
          email: settings.email_address ?? "",
          gst_number: settings.gst_number ?? "",
          gst_percentage: settings.gst_percentage === "" ? null : Number(settings.gst_percentage),
          service_charge: settings.service_charge === "" ? null : Number(settings.service_charge),
          discount_rules: settings.discount_rules ?? "",
          invoice_prefix: settings.invoice_prefix ?? "",
          invoice_number_format: settings.invoice_number_format ?? "",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "tenant_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: data,
    });
  } catch (error) {
    console.error("Settings save error:", error);

    return NextResponse.json(
      {
        error: "Unable to save settings",
        detail:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
