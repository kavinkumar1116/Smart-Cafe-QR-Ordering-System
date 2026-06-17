import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { fetchTenantsByEmail } from "@/lib/supabase/crud";

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