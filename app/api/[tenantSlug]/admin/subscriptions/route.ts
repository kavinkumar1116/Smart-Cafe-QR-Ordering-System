import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getTenantContextFromRequest } from "@/lib/tenant";
import {fetchTenantsDataByTenantID, fetchSubcriptionsByTenant, fetchSubcriptionsByPlan} from "@/lib/supabase/crud";


export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const getStoreData = await fetchTenantsDataByTenantID(tenantId);
    const invoicesData = await fetchSubcriptionsByTenant(tenantId);
    const subscriptionsPlanData = await fetchSubcriptionsByPlan();
    return NextResponse.json({ getStoreData, invoicesData: invoicesData || [],subscriptionsPlanData });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load invoices data", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
