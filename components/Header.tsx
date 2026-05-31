"use client";

import {
  UserRound,
  LogOut,
  Settings,
} from "lucide-react";
import Image from "next/image";
import defaultLogo from "@/public/assets/logo.png";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { tenantApiFetch } from "@/lib/tenant";
import { useCafeStore } from "@/src/store/useCafeStore";

export default function Header() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [openProfile, setOpenProfile] = useState(false);
  const [profileOwner, setProfileOwner] = useState("Not signed in");
  const profileRole = "Supabase user";

  // Subscribe only to header fields so unrelated store updates do not rerender this component.
  const restaurantName = useCafeStore((state) => state.restaurantName);
  const branchName = useCafeStore((state) => state.branchName);
  const logo = useCafeStore((state) => state.logo);
  const setCafeProfile = useCafeStore((state) => state.setCafeProfile);

  useEffect(() => {
    const format = (d: Date) =>
      d.toString().replace(" GMT+0530 (India Standard Time)", "");

    setCurrentTime(format(new Date()));

    const interval = setInterval(
      () => setCurrentTime(format(new Date())),
      1000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadCafeProfile() {
      const response = await tenantApiFetch("/api/admin/settings", { cache: "no-store" });
      const data = (await response.json()) as {
        settings?: {
          restaurantName?: string;
          branchName?: string;
          logo?: string;
          gstNumber?: string;
          contactNumber?: string;
        };
      };

      if (response.ok && data.settings) {
        setCafeProfile(data.settings);
      }
    }

    void loadCafeProfile();
  }, [setCafeProfile]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setProfileOwner(data.user?.email || "Not signed in");
    }

    void loadUser();
  }, []);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setOpenProfile(false);
    router.push("/admin");
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10 bg-espresso/80 px-4 py-3 backdrop-blur-xl sm:px-6"
      style={{ padding: "4px", marginBottom: "-16px" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* LEFT SIDE */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center justify-center rounded-lg bg-saffron text-espresso shadow-soft">
            <Image
              src={logo || defaultLogo}
              alt="Logo"
              width={60}
              height={60}
              unoptimized={Boolean(logo)}
              className="rounded-lg object-cover"
            />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-crema sm:text-xl">
              {restaurantName}
            </h1>
            <p className="truncate text-sm text-crema/62">{branchName}</p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4 relative">
          {/* TIME */}
          {currentTime && (
            <p className="hidden text-sm text-crema/62 lg:block">
              {currentTime}
            </p>
          )}

          {/* PROFILE BUTTON */}
          <button
            onClick={() => setOpenProfile(!openProfile)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-crema transition hover:bg-white/10"
          >
            <UserRound size={20} />
          </button>

          {/* PROFILE CARD */}
          {openProfile && (
            <div className="absolute right-0 top-14 w-72 rounded-2xl border border-white/10 bg-[#1c1c1c] p-4 shadow-2xl backdrop-blur-xl">
              {/* TOP */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron text-black font-bold">
                  {profileOwner.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    {profileOwner}
                  </h2>

                  <p className="text-sm text-white/60">{profileRole}</p>
                </div>
              </div>

              {/* MENU */}
              <div className="mt-4 space-y-2">
                <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10">
                  <Settings size={18} />
                  Settings
                </button>

                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
