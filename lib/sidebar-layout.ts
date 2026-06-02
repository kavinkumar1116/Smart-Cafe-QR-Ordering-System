import { cn } from "@/lib/utils";

/** localStorage key for desktop sidebar expanded/collapsed state */
export const SIDEBAR_STORAGE_KEY = "sidebar-state";

export const SIDEBAR_WIDTH_EXPANDED_PX = 280;
export const SIDEBAR_WIDTH_COLLAPSED_PX = 80;

/**
 * Offset for main shell (header + content) beside fixed desktop sidebar.
 * Both margin classes must remain full string literals for Tailwind JIT.
 */
export function getSidebarShellOffset(sidebarOpen: boolean, isHydrated = true) {
  return cn(
    "transition-all duration-300 ease-in-out",
    !isHydrated || sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[80px]"
  );
}

/** Fixed desktop sidebar width */
export function getSidebarWidthClass(sidebarOpen: boolean, isHydrated = true) {
  return cn(
    "transition-all duration-300 ease-in-out",
    !isHydrated || sidebarOpen ? "lg:w-[280px]" : "lg:w-[80px]"
  );
}
