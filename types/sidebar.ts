export interface SidebarContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleMenu: () => void;
  isDesktop: boolean;
  isHydrated: boolean;
}
