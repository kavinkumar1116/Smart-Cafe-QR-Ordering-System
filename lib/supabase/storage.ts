// lib/supabase/storage.ts

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";


export type UploadType = "cafe_logo" | "menu_image";

export async function uploadCafeLogo(file: File, uploadType: UploadType, tenantId: number) {
  const supabase = createBrowserSupabaseClient();

  if (uploadType === "cafe_logo") {
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    const folder = `public/${tenantId}`;

    // Get all existing files for this tenant
    const { data: files, error: listError } = await supabase.storage
      .from("cafe_logo")
      .list(folder);

    if (listError) {
      throw listError;
    }

    // Delete existing logo(s)
    if (files && files.length > 0) {
      const filesToDelete = files.map(
        (item) => `${folder}/${item.name}`
      );

      const { error: deleteError } = await supabase.storage
        .from("cafe_logo")
        .remove(filesToDelete);

      if (deleteError) {
        throw deleteError;
      }
    }

    // Upload new logo
    const fileName = `${folder}/logo.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("cafe_logo")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("cafe_logo")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }


  throw new Error("Invalid upload type.");
}

export async function uploadBase64Image(
  base64: string,
  tenantId: number,
  menuId: number
) {
  const supabase = createServerSupabaseClient();

  // Parse Base64
  const matches = base64.match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    throw new Error("Invalid Base64 image");
  }

  const mimeType = matches[1];
  const imageData = matches[2];

  const extension = mimeType.split("/")[1];
  const buffer = Buffer.from(imageData, "base64");

  const folderPath = `public/${tenantId}/${menuId}`;

  // Check for existing images
  const { data: existingFiles, error: listError } = await supabase.storage
    .from("menu_items_images")
    .list(folderPath);

  if (listError) {
    throw listError;
  }

  // Delete existing images
  if (existingFiles && existingFiles.length > 0) {
    const filesToDelete = existingFiles.map(
      (file) => `${folderPath}/${file.name}`
    );

    const { error: deleteError } = await supabase.storage
      .from("menu_items_images")
      .remove(filesToDelete);

    if (deleteError) {
      throw deleteError;
    }
  }

  // Upload new image
  const fileName = `${folderPath}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("menu_items_images")
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  // Return public URL
  const { data } = supabase.storage
    .from("menu_items_images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function deleteMenuImage(
  tenantId: number,
  menuId: number
) {
  const supabase = createServerSupabaseClient();

  const folderPath = `public/${tenantId}/${menuId}`;

  const { data: files, error } = await supabase.storage
    .from("menu_items_images")
    .list(folderPath);

  if (error) throw error;

  if (!files?.length) return;

  const filePaths = files.map(
    (file) => `${folderPath}/${file.name}`
  );

  const { error: deleteError } = await supabase.storage
    .from("menu_items_images")
    .remove(filePaths);

  if (deleteError) throw deleteError;
}