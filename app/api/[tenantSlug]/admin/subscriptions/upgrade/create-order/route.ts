// app/api/admin/subscriptions/upgrade/create-order/route.ts
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTenantContextFromRequest } from "@/lib/tenant";
import { fetchTenantsDataByTenantID, fetchSubcriptionsByTenant } from "@/lib/supabase/crud";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getTenantContextFromRequest(req);
    const body = await req.json();
    const {tenant_id, plan_code, plan_name, billing_cycle, amount, contact } = body;

    // Amount must be in paise (₹999 → 99900)
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `smartcafe_${Date.now()}`,
      notes: {
        tenant_id,
        plan_code,
        plan_name,
        billing_cycle,
        email: contact.email,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Razorpay order creation failed:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}