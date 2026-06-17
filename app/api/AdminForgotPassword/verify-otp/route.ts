import { NextResponse } from "next/server";
import { fetchTenantsByEmail } from "@/lib/supabase/crud";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    const users = await fetchTenantsByEmail(email);

    if (!users || users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Email not found",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    if (!user.reset_otp) {
      return NextResponse.json(
        {
          success: false,
          message: "No OTP found. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    if (user.reset_otp !== otp.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid OTP",
        },
        { status: 400 }
      );
    }

    if (
      !user.reset_otp_expiry ||
      new Date(user.reset_otp_expiry).getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "OTP expired",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
      tenant_id: user.tenant_id,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Verification failed",
      },
      { status: 500 }
    );
  }
}