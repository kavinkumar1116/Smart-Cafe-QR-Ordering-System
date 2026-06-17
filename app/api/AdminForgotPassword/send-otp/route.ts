import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { fetchTenantsByEmail, insertTenantResetOtp } from "@/lib/supabase/crud";


export async function POST(req: Request){
  try {
    const { email } = await req.json();

    const user = await fetchTenantsByEmail(email);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { success: false, message: "Email not found" },
        { status: 404 }
      );
    }

    const tenantId = user[0].tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: "Tenant ID not found" },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000)
  .toLocaleString("sv-SE", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  })
  .replace("T", " ");


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Smart Cafe</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 10 minutes.</p>
      `,
    });

    await insertTenantResetOtp(tenantId, otp, expiry);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 }
    );
  }
}