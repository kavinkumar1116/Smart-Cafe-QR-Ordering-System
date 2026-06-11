import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { insertCreateNewAccout } from "@/lib/supabase/crud";

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
      gst,
      fssai,
    } = body;

    // Generate unique tenant slug
    const baseSlug = (cafeName || "cafe")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const tenant_slug = `${baseSlug}-${randomSuffix}`;

    // Generate tenant_id as a random unique number (fits BIGINT/number)
    const tenant_id = Math.floor(10000000 + Math.random() * 90000000);

    // Map camelCase fields to database snake_case fields
    const payload = {
      tenant_id,
      tenant_slug,
      tenant_name: cafeName ? `${cafeName} - ${branch || ""}`.trim() : "Smart Cafe",
      owner_name: ownerName || "",
      email: email || "",
      phone: phone || "",
      subscription_plan: "Free Trial",
      status: 1, // Active
      cafe_name: cafeName || "",
      brand: brand || null,
      branch: branch || "",
      outlet_type: outletType || "",
      tables: tables || "",
      address: address || "",
      city: city || "",
      pincode: pincode || "",
      state: state || "",
      whatsapp: whatsapp || null,
      designation: designation || null,
      gst: gst || null,
      fssai: fssai || null,
    };

    const CreateNewAccout = await insertCreateNewAccout(payload as any);

    return NextResponse.json({
      success: true,
      message: "New Accout created successfully",
      data: CreateNewAccout,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}