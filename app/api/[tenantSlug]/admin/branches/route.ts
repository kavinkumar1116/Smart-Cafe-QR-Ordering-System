import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import bcrypt from "bcrypt";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { fetchTenantsByEmail, insertCreateNewAccout, updateTenantBranch, fetchTenantsByTenantID } from "@/lib/supabase/crud";

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

    // Get the current tenant to know the brand/email
    const { data: currentTenant, error: tenantError } = await supabase
      .from("tenants")
      .select("email, cafe_name")
      .eq("parent_tenant_id", tenantId)
      .single();

    if (tenantError) throw tenantError;

    if (!currentTenant?.email) {
      return NextResponse.json({ branches: [] });
    }

    // Fetch all branches matching the parent email
    const branches = await fetchTenantsByEmail(currentTenant.email);
    return NextResponse.json({ branches });
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
    const { branch_name, email, password, address, city, pincode, state, status } = body;

    if (!branch_name || !email || !password) {
      return NextResponse.json({ error: "Branch name, email, and password are required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get current tenant's template details
    const { data: currentTenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (tenantError) throw tenantError;

    // Check if the email already exists in tenants
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("tenant_id")
      .eq("email", email.trim())
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json({ error: "A branch with this email already exists." }, { status: 400 });
    }

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role: "admin",
          cafe_name: currentTenant.cafe_name,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: "Auth creation failed", detail: authError.message }, { status: 400 });
    }

    const tenant_slug = await generateTenantSlug();

    // Generate numeric tenant ID
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
      email: email.trim(),
      password_hash: hashedPassword,
      phone: currentTenant.phone || "",
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
    const { tenant_id, branch_name, email, address, city, pincode, state, status } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: "Tenant ID is required for editing" }, { status: 400 });
    }

    const updatedBranch = await updateTenantBranch(tenant_id, {
      branch: branch_name,
      email: email.trim(),
      address: address || "",
      city: city || "",
      pincode: pincode || "",
      state: state || "",
      status: status ? 1 : 0,
      is_head_branch: false,
    });

    return NextResponse.json({ success: true, branch: updatedBranch });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to update branch", detail: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
