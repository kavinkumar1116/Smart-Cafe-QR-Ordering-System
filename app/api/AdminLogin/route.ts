import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { fetchTenantsByEmail } from "@/lib/supabase/crud";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const users = await fetchTenantsByEmail(email);

    if (!users || users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // Determine head branch ID
    const headBranchId =
      user.is_head_branch || !user.parent_tenant_id
        ? user.tenant_id
        : user.parent_tenant_id;

    let branches: any[] = [];
    try {
      const supabase = createServerSupabaseClient();
      const { data: branchData, error: branchError } = await supabase
        .from("tenants")
        .select("tenant_id, tenant_slug, tenant_name, cafe_name, branch, is_head_branch, parent_tenant_id, city, address, phone, outlet_type, status")
        .or(`tenant_id.eq.${headBranchId},parent_tenant_id.eq.${headBranchId}`)
        .order("is_head_branch", { ascending: false });

      if (!branchError && branchData && branchData.length > 0) {
        branches = branchData;
      }
    } catch (e) {
      console.error("Error fetching branches for login:", e);
    }

    if (branches.length === 0) {
      branches = [
        {
          tenant_id: user.tenant_id,
          tenant_slug: user.tenant_slug,
          tenant_name: user.tenant_name,
          cafe_name: user.cafe_name || user.tenant_name,
          branch: user.branch || "Main Branch",
          is_head_branch: user.is_head_branch ?? true,
          parent_tenant_id: user.parent_tenant_id || null,
          city: user.city || "",
          address: user.address || "",
          phone: user.phone || "",
          outlet_type: user.outlet_type || "",
          status: user.status,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        tenant_id: user.tenant_id,
        tenant_slug: user.tenant_slug,
        tenant_name: user.tenant_name,
        owner_name: user.owner_name,
        email: user.email,
        subscription_plan: user.subscription_plan,
        status: user.status,
        branches,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}