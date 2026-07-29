import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import bcrypt from "bcrypt";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { insertCreateNewAccout, updateTenantBranch, fetchTenantsByTenantID, insertCreateSettings, fetchTenantsDataByTenantID } from "@/lib/supabase/crud";

async function generateTenantSlug(length = 10): Promise<string> {
  const numbers = "0123456789";
  let id = "";

  for (let i = 0; i < length; i++) {
    id += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // Avoid leading zero
  if (id[0] === "0") return generateTenantSlug(length);

  const existingTenants = await fetchTenantsByTenantID(Number(id));
  if (existingTenants.length > 0) {
    return generateTenantSlug(length);
  }

  return id;
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const supabase = createServerSupabaseClient();

    // Get the current tenant details
    const { data: currentTenant } = await supabase
      .from("tenants")
      .select("email, cafe_name")
      .eq("tenant_id", tenantId)
      .single();

    let query = supabase
      .from("tenants")
      .select("*");

    if (currentTenant?.email) {
      query = query.or(`parent_tenant_id.eq.${tenantId},email.eq.${currentTenant.email}`);
    } else {
      query = query.eq("parent_tenant_id", tenantId);
    }

    const { data: branches, error } = await query.order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ branches: branches || [] });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load branches", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const { tenantId } = await getTenantContextFromRequest(request);
    const body = await request.json();
    const { branch_name, password, address, city, pincode, state, status, phone } = body;

    if (!tenantId || !branch_name || !password) {
      return NextResponse.json({ error: "Tenant ID, branch name, and password are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get current tenant's template details
    const { data: currentTenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (tenantError) throw tenantError;

    const tenant_slug = await generateTenantSlug();

    // Generate numeric tenant ID and password hash
    const new_tenant_id = Math.floor(10000000 + Math.random() * 90000000);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create branch tenant record
    const newBranch = await insertCreateNewAccout({
      tenant_id: new_tenant_id,
      parent_tenant_id: tenantId,
      is_head_branch: false,
      tenant_slug,
      tenant_name: `${currentTenant.cafe_name} - ${branch_name}`.trim(),
      owner_name: currentTenant.owner_name || "",
      email: null as any,
      password_hash: hashedPassword,
      phone: phone || currentTenant.phone || "",
      subscription_plan: currentTenant.subscription_plan || "Free Trial",
      status: status ? 1 : 0,
      cafe_name: currentTenant.cafe_name || "",
      brand: currentTenant.brand || null,
      branch: branch_name,
      outlet_type: currentTenant.outlet_type || "",
      tables: currentTenant.tables || "",
      address: address || "",
      city: city || "",
      pincode: pincode || "",
      state: state || "",
      whatsapp: currentTenant.whatsapp || null,
      designation: currentTenant.designation || null,
      gst: currentTenant.gst || null,
      fssai: currentTenant.fssai || null,
      reset_otp: null,
      reset_otp_expiry: null,
    });

    const existingTenantsData = await fetchTenantsDataByTenantID(Number(tenantId));
    console.log("existingTenantsData===========", existingTenantsData)
    if (existingTenantsData && existingTenantsData.length > 0) {
      const parentTenant = existingTenantsData[0];
      const settingsPayload = {
        tenant_id: new_tenant_id,
        restaurant_name: parentTenant.tenant_name || parentTenant.cafe_name || "",
        branch_name: branch_name,
        address: address || parentTenant.address || "",
        contact_number: phone || parentTenant.phone || "",
        email: parentTenant.email || null,
        gst_number: parentTenant.gst || null,
      };
      try {
        await insertCreateSettings(settingsPayload as any);
      } catch (settingsError) {
        console.error("Settings insert failed:", settingsError);
      }
    }

    return NextResponse.json({ success: true, branch: newBranch });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create branch", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { tenant_id, branch_name, password, address, city, pincode, state, status, phone } = body;

    if (!tenant_id || !branch_name) {
      return NextResponse.json({ error: "Tenant ID and branch name are required" }, { status: 400 });
    }

    const updateData: any = {
      branch: branch_name,
      phone: phone || "",
      address: address || "",
      city: city || "",
      pincode: pincode || "",
      state: state || "",
      status: status ? 1 : 0,
      is_head_branch: false,
    };

    if (password && password.trim() !== "") {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const updatedBranch = await updateTenantBranch(tenant_id, updateData);

    return NextResponse.json({ success: true, branch: updatedBranch });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update branch", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}


