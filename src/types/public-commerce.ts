export type CartItem = {
  productId: number;
  quantity: number;
};

export type CustomerOrderDetails = {
  firstName?: string;
  lastName?: string;
  email?: string;
  customerName: string;
  phone: string;
  address: string;
  city?: string;
  note?: string;
};

export type OrderLine = {
  lineId: string;
  productId: number;
  productName: string;
  ownerEmail: string;
  ownerName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
};

export type OrderStatus = "Processing" | "Confirmed" | "Cancelled" | "Delivered";

export type PublicOrder = {
  id: number;
  createdAt: string;
  customer: CustomerOrderDetails;
  items: OrderLine[];
  totalAmount: number;
};

export type ShopOrderNotification = {
  id: number;
  createdAt: string;
  orderId: number;
  ownerEmail: string;
  ownerName: string;
  customer: CustomerOrderDetails;
  items: OrderLine[];
  totalAmount: number;
  isRead: boolean;
};

export type CustomerCommerceData = {
  cartItems: CartItem[];
  favoriteProductIds: number[];
  orders: PublicOrder[];
};

export interface PublicCommerceState {
  activeCustomerEmail: string | null;
  customerDataByEmail: Record<string, CustomerCommerceData>;
  cartItems: CartItem[];
  favoriteProductIds: number[];
  orders: PublicOrder[];
  notifications: ShopOrderNotification[];
  setActiveCustomer: (email: string | null) => void;
  addToCart: (productId: number) => void;
  increaseCartItem: (productId: number) => void;
  decreaseCartItem: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  toggleFavorite: (productId: number) => void;
  placeOrder: (payload: { items: OrderLine[]; customer: CustomerOrderDetails }) => void;
  updateOrderStatus: (lineId: string, status: OrderStatus) => void;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: (ownerEmail: string) => void;
}
