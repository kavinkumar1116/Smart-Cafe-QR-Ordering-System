import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import {
  insertCreateNewAccout,
  insertCreateSettings,
  fetchTenantsByTenantID,
  fetchTenantsByEmail,insertSubscriptions, updateSubscriptions,fetchSubcriptionsByPlan
} from "@/lib/supabase/crud";
import nodemailer from "nodemailer";
import { Currency } from "lucide-react";


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


export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Received insertCreateNewAccout Data:", body);

    const {
      cafeName,
      brand,
      branch,
      outletType,
      tables,
      address,
      city,
      pincode,
      state,
      phone,
      whatsapp,
      ownerName,
      designation,
      email,
      password,
      gst,
      fssai,
    } = body;

    // ✅ FIX 1: Check email duplicate FIRST before any heavy computation
    const normalizedEmail = email.trim().toLowerCase();

    const existingEmailTenants = await fetchTenantsByEmail(normalizedEmail);
    if (existingEmailTenants.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email already registered." },
        { status: 400 }
      );
    }

    // ✅ FIX 2: Hash password only after email check passes
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FIX 3: tenant_slug is the unique string identifier used in URLs
    const tenant_slug = await generateTenantSlug();

    // ✅ FIX 4: tenant_id is a separate numeric ID for DB relations
    const tenant_id = Math.floor(10000000 + Math.random() * 90000000);

    const payload = {
      tenant_id,
      tenant_slug,
      tenant_name: `${cafeName}${branch ? ` - ${branch}` : ""}`,
      owner_name: ownerName,
      email: normalizedEmail,
      password_hash: hashedPassword,
      phone,
      subscription_plan: "Free Trial",
      is_head_branch: true,
      status: 1,
      cafe_name: cafeName,
      brand: brand || null,
      branch,
      outlet_type: outletType,
      tables,
      address,
      city,
      pincode,
      state,
      whatsapp: whatsapp || null,
      designation: designation || null,
      gst: gst || null,
      fssai: fssai || null,
    };

    // ✅ FIX 5: Check if account insert actually returned data
    const CreateNewAccout = await insertCreateNewAccout(payload as any);

    if (!CreateNewAccout) {
      return NextResponse.json(
        { success: false, message: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    // ✅ FIX 6: Settings insert — log failure but don't block success response
    const settingsPayload = {
      tenant_id,
      restaurant_name: cafeName,
      branch_name: branch,
      address,
      contact_number: phone,
      email: normalizedEmail,
      gst_number: gst || null,
    };
    try {
      const CreateSettings = await insertCreateSettings(settingsPayload as any);
    } catch (settingsError) {
      console.error("Settings insert failed:", settingsError);
    }

    // ✅ Subscriptions insert — isolated try/catch, non-blocking
try {
  const GetfetchSubcriptionsByPlan = await fetchSubcriptionsByPlan(1);
  console.log("GetfetchSubcriptionsByPlan", GetfetchSubcriptionsByPlan);

  if (!GetfetchSubcriptionsByPlan || GetfetchSubcriptionsByPlan.length === 0) {
    console.warn("No subscription plan found for plan ID 1. Skipping subscription insert.");
  } else {
    const plan = GetfetchSubcriptionsByPlan[0];
    console.log("plan", plan);

    // ✅ Calculate end_date based on billing_cycle
    const startDate = new Date();
    const endDate = new Date(startDate);

const nextBillingDate = plan.plan_name === "Free Trial" ? new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;


    const subscriptionsPayload = {
      tenant_id: tenant_id,
      plan_name: plan.plan_name,          // ✅ Fixed: was using plan_code for plan_name
      plan_code: plan.plan_code,
      next_billing_cycle: nextBillingDate ? nextBillingDate.toISOString().split("T")[0] : null,
      amount: plan.monthly_price,
      gst_percentage: 0,
      start_date: startDate.toISOString().split("T")[0],
      end_date: nextBillingDate,   // ✅ 14 days after complete
      status: 1,
      payment_status: true,
      transaction_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
 console.log("subscriptionsPayload", subscriptionsPayload);
    const CreateSubscriptions = await insertSubscriptions(subscriptionsPayload as any);
    console.log("CreateSubscriptions", CreateSubscriptions);
  }
} catch (subscriptionError) {
  // Non-fatal: log it, don't fail the whole registration request
  console.error("Subscription insert failed:", subscriptionError);
}

    const loginUrl = `https://smart-cafe-qr-ordering-system.vercel.app/login`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Smart Cafe" <${process.env.SMTP_EMAIL}>`,
        to: normalizedEmail,
        subject: "🎉 Welcome to Smart Cafe - Free Trial Activated",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;">
          
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
            <tr>
              <td align="center">

                <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td style="background:#111827;padding:30px;text-align:center;">
                      <h1 style="margin:0;color:#f59e0b;font-size:32px;">
                        ☕ Smart Cafe
                      </h1>
                      <p style="margin-top:10px;color:#d1d5db;font-size:15px;">
                        QR Ordering & Billing Platform
                      </p>
                    </td>
                  </tr>

                  <!-- Welcome -->
                  <tr>
                    <td style="padding:35px;">
                      <h2 style="margin-top:0;color:#111827;">
                        🎉 Free Trial Activated Successfully
                      </h2>

                      <p style="font-size:15px;color:#4b5563;line-height:1.8;">
                        Hello <strong>${ownerName}</strong>,
                      </p>

                      <p style="font-size:15px;color:#4b5563;line-height:1.8;">
                        Thank you for choosing <strong>Smart Cafe</strong>.
                        Your account has been successfully created and your
                        <strong>14-Day Free Trial</strong> is now active.
                      </p>

                      <!-- Cafe Details -->
                      <table width="100%" cellpadding="10" cellspacing="0" style="margin-top:20px;border:1px solid #e5e7eb;border-radius:10px;">
                        <tr>
                          <td colspan="2" style="background:#f9fafb;font-weight:bold;font-size:16px;">
                            Cafe Information
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Cafe Name</strong></td>
                          <td>${cafeName}</td>
                        </tr>
                        <tr>
                          <td><strong>Branch</strong></td>
                          <td>${branch}</td>
                        </tr>
                        <tr>
                          <td><strong>Owner</strong></td>
                          <td>${ownerName}</td>
                        </tr>
                        <tr>
                          <td><strong>Email</strong></td>
                          <td>${normalizedEmail}</td>
                        </tr>
                        <tr>
                          <td><strong>Phone</strong></td>
                          <td>${phone}</td>
                        </tr>
                        <tr>
                          <td><strong>Outlet Type</strong></td>
                          <td>${outletType}</td>
                        </tr>
                        <tr>
                          <td><strong>Tenant ID</strong></td>
                          <td>${tenant_slug}</td>
                        </tr>
                        <tr>
                          <td><strong>Trial Plan</strong></td>
                          <td>14 Days Free Trial</td>
                        </tr>
                      </table>

                      <!-- Login -->
                      <div style="margin-top:30px;padding:20px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
                        <h3 style="margin-top:0;color:#92400e;">
                          Login Details
                        </h3>
                        <p><strong>Email:</strong> ${normalizedEmail}</p>
                        <p><strong>Login URL:</strong></p>
                        <a href="${loginUrl}"
                           style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
                          Login to Dashboard
                        </a>
                      </div>

                      <!-- Features -->
                      <div style="margin-top:30px;">
                        <h3 style="color:#111827;">Included in Your Trial</h3>
                        <ul style="color:#4b5563;line-height:2;">
                          <li>✅ QR Code Ordering</li>
                          <li>✅ Unlimited Orders</li>
                          <li>✅ Kitchen Order Management</li>
                          <li>✅ Billing & Invoice Management</li>
                          <li>✅ Menu Management</li>
                          <li>✅ Sales Reports & Analytics</li>
                        </ul>
                      </div>

                      <p style="margin-top:30px;color:#4b5563;line-height:1.8;">
                        Need help getting started? Reply to this email and our team will assist you.
                      </p>

                      <p style="color:#4b5563;">
                        Regards,<br>
                        <strong>Smart Cafe Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#111827;padding:20px;text-align:center;">
                      <p style="margin:0;color:#9ca3af;font-size:12px;">
                        © ${new Date().getFullYear()} Smart Cafe. All Rights Reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>

        </body>
        </html>
        `,
      });
    } catch (mailError) {
      console.error("Email sending failed:", mailError);
    }

    return NextResponse.json({
      success: true,
      message: "New Account created successfully",
      data: CreateNewAccout,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}