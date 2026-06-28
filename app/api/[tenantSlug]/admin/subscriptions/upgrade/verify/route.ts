import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { updateSubscriptions } from "@/lib/supabase/crud";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("body verifiy====", body)
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_code,
      plan_name,
      billing_cycle,
      amount,
      tenant_id,
    } = body;

    // ── 1. Validate required fields ────────────────────────────────────
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !plan_code ||
      !plan_name ||
      !billing_cycle ||
      !amount ||
      !tenant_id
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required payment fields." },
        { status: 400 }
      );
    }

    // ── 2. Verify Razorpay signature (CRITICAL — never skip) ───────────
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Signature mismatch", {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification failed. Invalid signature.",
        },
        { status: 400 }
      );
    }

    // ── 3. Calculate billing dates ─────────────────────────────────────
    const startDate = new Date();
    const endDate = new Date();

    if (billing_cycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    console.log("expectedSignature", expectedSignature, "razorpay_signature", razorpay_signature);

    // ── 4. Update subscription in Supabase ─────────────────────────────
    const updated = await updateSubscriptions(tenant_id, {
      plan_name,
      plan_code,
      next_billing_cycle: endDate.toISOString(),
      amount,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      payment_status: true,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transaction_id: razorpay_payment_id,
      updated_at: new Date().toISOString(),
    });
    console.log("updated====", updated);

    // ── 5. Return success ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      payment_id: razorpay_payment_id,
      plan: updated.plan_name,
      valid_until: updated.end_date,
    });

  } catch (error: any) {
    console.error("Payment verification error:", {
      message: error.message,
      stack: error.stack,
    });

    // Distinguish between known and unknown errors
    const isKnownError =
      error.message?.includes("No subscription found") ||
      error.message?.includes("Invalid signature") ||
      error.message?.includes("Missing required");

    return NextResponse.json(
      {
        success: false,
        message: isKnownError
          ? error.message
          : "An unexpected error occurred. Please contact support.",
      },
      { status: isKnownError ? 400 : 500 }
    );
  }
}