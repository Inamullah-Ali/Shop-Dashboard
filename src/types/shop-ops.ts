export type PaymentMethod = "Cash" | "Card" | "Other";

export type SaleEntry = {
  id: number;
  createdAt: string;
  ownerEmail: string;
  customerName: string;
  productName: string;
  quantity: number;
  amount: number;
  paymentMethod: PaymentMethod;
};

export type CustomerEntry = {
  id: number;
  createdAt: string;
  ownerEmail: string;
  name: string;
  phone: string;
};

export type PurchaseEntry = {
  id: number;
  createdAt: string;
  ownerEmail: string;
  supplierName: string;
  itemName: string;
  quantity: number;
  amount: number;
};

export type ExpenseEntry = {
  id: number;
  createdAt: string;
  ownerEmail: string;
  category: string;
  note: string;
  amount: number;
};

export interface ShopOpsState {
  sales: SaleEntry[];
  customers: CustomerEntry[];
  purchases: PurchaseEntry[];
  expenses: ExpenseEntry[];
  addSale: (sale: Omit<SaleEntry, "id" | "createdAt">) => void;
  addCustomer: (customer: Omit<CustomerEntry, "id" | "createdAt">) => void;
  addPurchase: (purchase: Omit<PurchaseEntry, "id" | "createdAt">) => void;
  addExpense: (expense: Omit<ExpenseEntry, "id" | "createdAt">) => void;
}
