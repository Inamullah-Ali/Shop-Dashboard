export type PackageDuration = string;

export type UserRole = "admin" | "shopAdmin" | "customer";

export type IShop = {
  id: number;
  createdAt?: string;
  paymentStatus?: "Received" | "Not Received";
  paymentDate?: string;
  appwriteDocumentId?: string;
  appwriteUserId?: string;
  selectedPlanId?: number;
  selectedPlanName?: string;
  selectedPlanPrice?: number;
  shopName: string;
  ownerName: string;
  phoneNumber: any;
  shopAddress: string;
  city: string;
  shopType: string;
  email: string;
  password?: string;
  role?: UserRole;
  status: string;
  packageDuration?: PackageDuration;
  image?: string;
};

export interface ShopState {
  shops: IShop[];
  setShops: (shops: IShop[]) => void;
  addShop: (shop: Omit<IShop, "id">) => void;
  deleteShop: (id: number) => void;
  editShop: (id: number, updatedShop: Partial<IShop>) => void;
}

export interface EditShop {
  id: number;
  img: string;
  heading: string;
  price: string;
}

export interface DeleteShop {
  shopid: number;
  shop: IShop;
}
