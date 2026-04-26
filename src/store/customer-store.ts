import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CustomerAccount, CustomerRegistration } from "@/types/customer";

const normalizePhoneValue = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits || value.trim();
};

const normalizeLookupValue = (value: string) => value.trim();

const normalizeCustomer = (customer: CustomerAccount): CustomerAccount => ({
  ...customer,
  firstName: customer.firstName.trim(),
  lastName: customer.lastName.trim(),
  email: customer.email.toLowerCase().trim(),
  phone: customer.phone.trim(),
  address: customer.address.trim(),
  city: customer.city.trim(),
  avatar: customer.avatar?.trim() || undefined,
  password: customer.password.trim(),
});

type CustomerStore = {
  customers: CustomerAccount[];
  registerCustomer: (customer: CustomerRegistration) => CustomerAccount;
  findCustomerByEmail: (email: string) => CustomerAccount | undefined;
  findCustomerByEmailOrPhone: (identifier: string) => CustomerAccount | undefined;
  authenticateCustomer: (email: string, password: string) => CustomerAccount | undefined;
  resetCustomerPassword: (identifier: string, nextPassword: string) => CustomerAccount;
};

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],

      registerCustomer: (customer) => {
        const normalizedEmail = customer.email.toLowerCase().trim();
        const existing = get().customers.find((entry) => entry.email === normalizedEmail);

        if (existing) {
          throw new Error("An account with this email already exists");
        }

        const id = Date.now();
        const nextCustomer = normalizeCustomer({
          ...customer,
          id,
          createdAt: new Date(id).toISOString(),
        });

        set((state) => ({
          customers: [nextCustomer, ...state.customers],
        }));

        return nextCustomer;
      },

      findCustomerByEmail: (email) =>
        get().customers.find((customer) => customer.email === email.toLowerCase().trim()),

      findCustomerByEmailOrPhone: (identifier) => {
        const normalizedIdentifier = normalizeLookupValue(identifier);

        if (!normalizedIdentifier) {
          return undefined;
        }

        const isEmailLookup = normalizedIdentifier.includes("@");

        if (isEmailLookup) {
          return get().customers.find(
            (customer) => customer.email === normalizedIdentifier.toLowerCase(),
          );
        }

        const normalizedPhone = normalizePhoneValue(normalizedIdentifier);

        return get().customers.find(
          (customer) => normalizePhoneValue(customer.phone) === normalizedPhone,
        );
      },

      authenticateCustomer: (email, password) =>
        get().customers.find(
          (customer) =>
            customer.email === email.toLowerCase().trim() &&
            customer.password === password.trim(),
        ),

      resetCustomerPassword: (identifier, nextPassword) => {
        const normalizedIdentifier = normalizeLookupValue(identifier);
        const normalizedNextPassword = nextPassword.trim();

        if (!normalizedIdentifier) {
          throw new Error("Please enter your email or phone number.");
        }

        if (normalizedNextPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const target = get().findCustomerByEmailOrPhone(normalizedIdentifier);

        if (!target) {
          throw new Error("No customer account found for this email or phone number.");
        }

        const updated = normalizeCustomer({
          ...target,
          password: normalizedNextPassword,
        });

        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === target.id ? updated : customer,
          ),
        }));

        return updated;
      },
    }),
    {
      name: "customer-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.customers = state.customers.map(normalizeCustomer);
      },
    },
  ),
);
