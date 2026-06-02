"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SidebarContextValue } from "@/types/sidebar";
import { SIDEBAR_STORAGE_KEY } from "@/lib/sidebar-layout";

const SidebarContext = createContext<SidebarContextValue | null>(null);

const DESKTOP_MEDIA = "(min-width: 1024px)";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved !== null) {
        setSidebarOpen(JSON.parse(saved) as boolean);
      }
    } catch {
      /* ignore invalid stored value */
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen, isHydrated]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA);
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    if (window.matchMedia(DESKTOP_MEDIA).matches) {
      setSidebarOpen((prev) => !prev);
    } else {
      setMobileOpen((prev) => !prev);
    }
  }, []);

  const value = useMemo<SidebarContextValue>(
    () => ({
      sidebarOpen,
      setSidebarOpen,
      mobileOpen,
      setMobileOpen,
      toggleSidebar,
      toggleMobile,
      closeMobile,
      toggleMenu,
      isDesktop,
      isHydrated,
    }),
    [
      sidebarOpen,
      mobileOpen,
      toggleSidebar,
      toggleMobile,
      closeMobile,
      toggleMenu,
      isDesktop,
      isHydrated,
    ]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
