import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/api";
import { insertCreateNewAccout } from "@/lib/supabase/crud";


function generateTenantId(length = 10): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let id =
    letters.charAt(Math.floor(Math.random() * letters.length));

  for (let i = 1; i < length; i++) {
    id += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);


    const tenant_slug = generateTenantId();

    // Generate tenant id
    const tenant_id = Math.floor(
      10000000 + Math.random() * 90000000
    );

    const payload = {
      tenant_id,
      tenant_slug,
      tenant_name: cafeName
        ? `${cafeName} - ${branch || ""}`.trim()
        : "Smart Cafe",

      owner_name: ownerName || "",
      email: email || "",

      // Save hashed password
      password_hash: hashedPassword,

      phone: phone || "",

      subscription_plan: "Free Trial",
      status: 1,

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
      message: "New Account created successfully",
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