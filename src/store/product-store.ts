import type { Product, ProductState } from "@/types/product";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const normalizeProduct = (product: Product): Product => ({
  ...product,
  productName: product.productName.trim(),
  ownerEmail: product.ownerEmail.toLowerCase().trim(),
  ownerName: product.ownerName.trim(),
  price: Number.isFinite(product.price) && product.price >= 0 ? product.price : 0,
  quantity:
    Number.isFinite(product.quantity) && product.quantity >= 0
      ? Math.trunc(product.quantity)
      : 0,
  discount:
    Number.isFinite(product.discount) && product.discount >= 0
      ? product.discount
      : 0,
});

const normalizeProducts = (products: Product[]) => products.map(normalizeProduct);

export const useProductStore = create<ProductState>()(
  persist(
    (set) => ({
      products: [],

      setProducts: (products) => set({ products: normalizeProducts(products) }),

      addProduct: (product) =>
        set((state) => {
          const normalizedInput = normalizeProduct(product as Product);
          const existingIndex = state.products.findIndex(
            (item) =>
              item.ownerEmail === normalizedInput.ownerEmail &&
              item.productName.toLowerCase() === normalizedInput.productName.toLowerCase(),
          );

          if (existingIndex >= 0) {
            const existing = state.products[existingIndex];
            const merged = normalizeProduct({
              ...existing,
              quantity: existing.quantity + normalizedInput.quantity,
            });

            return {
              products: state.products.map((item, index) =>
                index === existingIndex ? merged : item,
              ),
            };
          }

          const id = Date.now();
          const nextProduct = normalizeProduct({
            ...normalizedInput,
            id,
            createdAt: new Date(id).toISOString(),
          });

          return {
            products: [nextProduct, ...state.products],
          };
        }),

      updateProduct: (id, updatedProduct) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? normalizeProduct({ ...product, ...updatedProduct })
              : product
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
        })),
    }),
    {
      name: "products-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.products) {
          return;
        }

        state.setProducts(normalizeProducts(state.products));
      },
    }
  )
);