export type CustomerAccount = {
  id: number;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  avatar?: string;
  password: string;
};

export type CustomerRegistration = Omit<CustomerAccount, "id" | "createdAt">;
