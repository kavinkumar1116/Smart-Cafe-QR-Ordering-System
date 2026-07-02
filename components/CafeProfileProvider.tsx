"use client";

import { useEffect } from "react";
import { tenantApiFetch } from "@/lib/tenant";
import { useCafeStore } from "@/src/store/useCafeStore";

export default function CafeProfileProvider() {
  const setCafeProfile = useCafeStore(
    (state) => state.setCafeProfile
  );

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await tenantApiFetch(
          "/api/admin/settings",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();
        if (response.ok && data.settings) {
          setCafeProfile({
            tenantId: data.settings.tenant_id,
            tenantSlug: data.getStoreData[0].tenant_slug,
            restaurantName: data.settings.restaurant_name || "",
            branchName: data.settings.branch_name || "",
            logo: data.settings.logo_url || "",
            gstNumber: data.settings.gst_number || "",
            contactNumber: data.settings.contact_number || "",
            gstPercentage: data.settings.gst_percentage || "",
            subscriptionExpiringDate: data.subscriptionExpiringMessage || "",
            subscriptionStatus: data.subscriptionStatus || "",
            isHeadBranch: data.getStoreData[0].is_head_branch || false

          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadSettings();
  }, [setCafeProfile]);

  return null;
}