import { create } from "zustand";

// Core restaurant profile shared across the client application.
export interface CafeProfileState {
  tenantId: number;
  tenantSlug: string;
  restaurantName: string;
  branchName: string;
  logo: string;
  gstNumber: string;
  contactNumber: string;
  gstPercentage: number;
  subscriptionExpiringDate: string;
  subscriptionStatus: string;
  isHeadBranch: boolean;
}

// Store actions are kept explicit so components can subscribe only to what they need.
interface CafeStore extends CafeProfileState {
  setTenantId: (tenantId: number) => void;
  setTenantSlug: (tenantSlug: string) => void;
  setRestaurantName: (restaurantName: string) => void;
  setBranchName: (branchName: string) => void;
  setLogo: (logo: string) => void;
  setGstNumber: (gstNumber: string) => void;
  setContactNumber: (contactNumber: string) => void;
  setCafeProfile: (profile: Partial<CafeProfileState>) => void;
  setGstPercentage: (gstPercentage: number) => void;
  resetCafeProfile: () => void;
  setSubscriptionExpiringDate: (subscriptionExpiringDate: string) => void;
  setSubscriptionStatus: (subscriptionStatus: string) => void;
  setIsHeadBranch: (isHeadBranch: boolean) => void;
}

// Stable defaults prevent empty header UI before settings are loaded.
export const defaultCafeProfile: CafeProfileState = {
  tenantId: 0,
  tenantSlug: "",
  restaurantName: "",
  branchName: "",
  logo: "",
  gstNumber: "",
  contactNumber: "",
  gstPercentage: 0,
  subscriptionExpiringDate: "",
  subscriptionStatus: "",
  isHeadBranch: false,
};

// Zustand hook for global cafe identity state.
// Use selector functions in components to avoid unnecessary rerenders.
export const useCafeStore = create<CafeStore>((set) => ({
  ...defaultCafeProfile,

  setTenantId: (tenantId) => set({ tenantId }),
  setTenantSlug : (tenantSlug) => set({ tenantSlug }),
  setRestaurantName: (restaurantName) => set({ restaurantName }),
  setBranchName: (branchName) => set({ branchName }),
  setLogo: (logo) => set({ logo }),
  setGstNumber: (gstNumber) => set({ gstNumber }),
  setContactNumber: (contactNumber) => set({ contactNumber }),
  setGstPercentage: (gstPercentage) => set({ gstPercentage }),
  setSubscriptionExpiringDate: (subscriptionExpiringDate) => set({ subscriptionExpiringDate }),
  setSubscriptionStatus: (subscriptionStatus) => set({ subscriptionStatus }),
  setIsHeadBranch: (isHeadBranch) => set({ isHeadBranch }),

  // Batch updates are useful when hydrating from the settings API.
setCafeProfile: (profile) =>
  set((current) => ({
    ...current,
    ...Object.fromEntries(
      Object.entries(profile).filter(
        ([, value]) => value !== undefined && value !== null
      )
    ),
  })),

  resetCafeProfile: () => set(defaultCafeProfile),
}));
