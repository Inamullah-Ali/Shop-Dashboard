import type {
  CustomerEntry,
  ExpenseEntry,
  PurchaseEntry,
  SaleEntry,
  ShopOpsState,
} from "@/types/shop-ops";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const normalizeSale = (sale: SaleEntry): SaleEntry => ({
  ...sale,
  ownerEmail: sale.ownerEmail.toLowerCase().trim(),
  customerName: sale.customerName.trim(),
  productName: sale.productName.trim(),
  quantity: Number.isFinite(sale.quantity) && sale.quantity > 0 ? Math.trunc(sale.quantity) : 1,
  amount: Number.isFinite(sale.amount) && sale.amount >= 0 ? sale.amount : 0,
  paymentMethod: sale.paymentMethod,
});

const normalizeCustomer = (customer: CustomerEntry): CustomerEntry => ({
  ...customer,
  ownerEmail: customer.ownerEmail.toLowerCase().trim(),
  name: customer.name.trim(),
  phone: customer.phone.trim(),
});

const normalizePurchase = (purchase: PurchaseEntry): PurchaseEntry => ({
  ...purchase,
  ownerEmail: purchase.ownerEmail.toLowerCase().trim(),
  supplierName: purchase.supplierName.trim(),
  itemName: purchase.itemName.trim(),
  quantity:
    Number.isFinite(purchase.quantity) && purchase.quantity > 0
      ? Math.trunc(purchase.quantity)
      : 1,
  amount: Number.isFinite(purchase.amount) && purchase.amount >= 0 ? purchase.amount : 0,
});

const normalizeExpense = (expense: ExpenseEntry): ExpenseEntry => ({
  ...expense,
  ownerEmail: expense.ownerEmail.toLowerCase().trim(),
  category: expense.category.trim(),
  note: expense.note.trim(),
  amount: Number.isFinite(expense.amount) && expense.amount >= 0 ? expense.amount : 0,
});

export const useShopOpsStore = create<ShopOpsState>()(
  persist(
    (set) => ({
      sales: [],
      customers: [],
      purchases: [],
      expenses: [],

      addSale: (sale) =>
        set((state) => {
          const id = Date.now();
          const nextSale = normalizeSale({
            ...sale,
            id,
            createdAt: new Date(id).toISOString(),
          });

          return {
            sales: [nextSale, ...state.sales],
          };
        }),

      addCustomer: (customer) =>
        set((state) => {
          const id = Date.now();
          const nextCustomer = normalizeCustomer({
            ...customer,
            id,
            createdAt: new Date(id).toISOString(),
          });

          return {
            customers: [nextCustomer, ...state.customers],
          };
        }),

      addPurchase: (purchase) =>
        set((state) => {
          const id = Date.now();
          const nextPurchase = normalizePurchase({
            ...purchase,
            id,
            createdAt: new Date(id).toISOString(),
          });

          return {
            purchases: [nextPurchase, ...state.purchases],
          };
        }),

      addExpense: (expense) =>
        set((state) => {
          const id = Date.now();
          const nextExpense = normalizeExpense({
            ...expense,
            id,
            createdAt: new Date(id).toISOString(),
          });

          return {
            expenses: [nextExpense, ...state.expenses],
          };
        }),
    }),
    {
      name: "shop-operations-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.sales = state.sales.map(normalizeSale);
        state.customers = state.customers.map(normalizeCustomer);
        state.purchases = state.purchases.map(normalizePurchase);
        state.expenses = state.expenses.map(normalizeExpense);
      },
    }
  )
);
