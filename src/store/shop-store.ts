import type { IShop, ShopState } from "@/types/tabledata";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizePackageDuration } from "@/lib/package-utils";

const normalizeShop = (shop: IShop): IShop => {
  const packageDuration = normalizePackageDuration(shop.packageDuration);
  const createdAt = shop.createdAt ?? new Date(shop.id).toISOString();

  return {
    ...shop,
    createdAt,
    role: shop.role === "admin" ? "admin" : "shopAdmin",
    paymentStatus: shop.paymentStatus ?? "Not Received",
    paymentDate: shop.paymentDate,
    selectedPlanId: shop.selectedPlanId,
    selectedPlanName: shop.selectedPlanName,
    selectedPlanPrice: shop.selectedPlanPrice ?? 0,
    packageDuration,
    status: shop.status === "Active" ? "Active" : "Inactive",
  };
};

const normalizeShops = (shops: IShop[]) => shops.map(normalizeShop);

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      shops: [],

      setShops: (shops) => set({ shops: normalizeShops(shops) }),

      addShop: (shop) =>
        set((state) => {
          const id = Date.now();
          const nextShop = normalizeShop({
            ...shop,
            id,
            createdAt: new Date(id).toISOString(),
          });

          return {
            shops: [...state.shops, nextShop],
          };
        }),
      deleteShop: (id) =>
        set((state) => ({
          shops: state.shops.filter((s) => s.id !== id),
        })),
      editShop: (id, updatedShop) =>
        set((state) => ({
          shops: state.shops.map((s) =>
            s.id === id ? normalizeShop({ ...s, ...updatedShop }) : s
          ),
        })),
    }),
    {
      name: "addproduct",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.shops) {
          return;
        }

        state.setShops(normalizeShops(state.shops));
      },
    }
  )
);
