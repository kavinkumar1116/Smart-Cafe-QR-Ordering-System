import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { fetchTenantsByEmail, updateForgotPassword } from "@/lib/supabase/crud";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const getUser = await fetchTenantsByEmail(email);

    if (!getUser || getUser.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const user = getUser[0];

    if (!user.tenant_id) {
      return NextResponse.json(
        { success: false, message: "Tenant ID not found" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAccount = await updateForgotPassword(user.tenant_id, hashedPassword);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}