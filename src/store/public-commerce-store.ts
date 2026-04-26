import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  CustomerCommerceData,
  CustomerOrderDetails,
  OrderLine,
  PublicCommerceState,
  OrderStatus,
  ShopOrderNotification,
} from "@/types/public-commerce";
import { useProductStore } from "@/store/product-store";
import { useShopOpsStore } from "@/store/shop-ops-store";
import {
  fetchProductsFromAppwrite,
  updateProductInAppwrite,
} from "@/service/appwriteProduct";

const DEFAULT_ORDER_STATUS: OrderStatus = "Processing";

const getFallbackLineId = (item: OrderLine) =>
  [item.productId, item.ownerEmail, item.productName, item.quantity, item.unitPrice, item.totalPrice]
    .map(String)
    .join("-");

const normalizeCustomer = (customer: CustomerOrderDetails): CustomerOrderDetails => ({
  firstName: customer.firstName?.trim() || "",
  lastName: customer.lastName?.trim() || "",
  email: customer.email?.toLowerCase().trim() || "",
  customerName: customer.customerName.trim(),
  phone: customer.phone.trim(),
  address: customer.address.trim(),
  city: customer.city?.trim() || "",
  note: customer.note?.trim() || "",
});

const normalizeOrderLine = (item: OrderLine): OrderLine => ({
  ...item,
  lineId: item.lineId || getFallbackLineId(item),
  productName: item.productName.trim(),
  ownerEmail: item.ownerEmail.toLowerCase().trim(),
  ownerName: item.ownerName.trim(),
  quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.trunc(item.quantity) : 1,
  unitPrice: Number.isFinite(item.unitPrice) && item.unitPrice >= 0 ? item.unitPrice : 0,
  totalPrice: Number.isFinite(item.totalPrice) && item.totalPrice >= 0 ? item.totalPrice : 0,
  status: item.status ?? DEFAULT_ORDER_STATUS,
});

const normalizeOrderLines = (items: OrderLine[]) => items.map(normalizeOrderLine);

const emptyCustomerData = (): CustomerCommerceData => ({
  cartItems: [],
  favoriteProductIds: [],
  orders: [],
});

const normalizeCustomerData = (data?: Partial<CustomerCommerceData>): CustomerCommerceData => ({
  cartItems: (data?.cartItems || []).map((item) => ({
    productId: item.productId,
    quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? Math.trunc(item.quantity) : 1,
  })),
  favoriteProductIds: (data?.favoriteProductIds || []).filter((id) => Number.isFinite(id)),
  orders: (data?.orders || []).map(normalizePublicOrder),
});

const updateCustomerScopedData = (
  state: PublicCommerceState,
  updates: Partial<CustomerCommerceData>,
): Partial<PublicCommerceState> => {
  if (!state.activeCustomerEmail) {
    return updates;
  }

  const emailKey = state.activeCustomerEmail.toLowerCase().trim();
  const current = normalizeCustomerData(state.customerDataByEmail[emailKey]);
  const next: CustomerCommerceData = {
    cartItems: updates.cartItems ?? current.cartItems,
    favoriteProductIds: updates.favoriteProductIds ?? current.favoriteProductIds,
    orders: updates.orders ?? current.orders,
  };

  return {
    ...updates,
    customerDataByEmail: {
      ...state.customerDataByEmail,
      [emailKey]: next,
    },
  };
};

const setProductQuantity = (productId: number, quantity: number) => {
  const normalizedQuantity = Math.max(0, Math.trunc(quantity));

  useProductStore.setState((state) => ({
    products: state.products.map((product) =>
      product.id === productId ? { ...product, quantity: normalizedQuantity } : product,
    ),
  }));
};

const refreshProductsFromAppwrite = async () => {
  try {
    const products = await fetchProductsFromAppwrite();
    useProductStore.getState().setProducts(products);
  } catch {
    // Ignore refresh errors; realtime sync will retry later.
  }
};

const persistProductQuantity = async (productId: number, quantity: number) => {
  const products = useProductStore.getState().products;
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    return;
  }

  const normalizedQuantity = Math.max(0, Math.trunc(quantity));

  try {
    await updateProductInAppwrite({
      appwriteDocumentId: product.appwriteDocumentId,
      ownerEmail: product.ownerEmail,
      productName: product.productName,
      updates: {
        productName: product.productName,
        productImage: product.productImage,
        price: product.price,
        quantity: normalizedQuantity,
        discount: product.discount,
      },
    });
  } catch {
    await refreshProductsFromAppwrite();
  }
};

const applyInventoryDelta = (line: OrderLine, delta: number) => {
  const products = useProductStore.getState().products;
  const product = products.find((entry) => entry.id === line.productId);

  if (!product) {
    return;
  }

  const nextQuantity = product.quantity + delta;
  setProductQuantity(line.productId, nextQuantity);
  void persistProductQuantity(line.productId, nextQuantity);
};

const normalizePublicOrder = (order: PublicCommerceState["orders"][number]) => ({
  ...order,
  customer: normalizeCustomer(order.customer),
  items: normalizeOrderLines(order.items),
});

const normalizeNotification = (
  notification: ShopOrderNotification,
): ShopOrderNotification => ({
  ...notification,
  ownerEmail: notification.ownerEmail.toLowerCase().trim(),
  ownerName: notification.ownerName.trim(),
  customer: normalizeCustomer(notification.customer),
  items: normalizeOrderLines(notification.items),
  totalAmount:
    Number.isFinite(notification.totalAmount) && notification.totalAmount >= 0
      ? notification.totalAmount
      : 0,
  isRead: Boolean(notification.isRead),
});

export const usePublicCommerceStore = create<PublicCommerceState>()(
  persist(
    (set) => ({
      activeCustomerEmail: null,
      customerDataByEmail: {},
      cartItems: [],
      favoriteProductIds: [],
      orders: [],
      notifications: [],

      setActiveCustomer: (email) =>
        set((state) => {
          const normalizedEmail = email?.toLowerCase().trim() || null;

          if (!normalizedEmail) {
            return {
              activeCustomerEmail: null,
              cartItems: [],
              favoriteProductIds: [],
              orders: [],
            };
          }

          const scopedData = normalizeCustomerData(state.customerDataByEmail[normalizedEmail]);

          return {
            activeCustomerEmail: normalizedEmail,
            cartItems: scopedData.cartItems,
            favoriteProductIds: scopedData.favoriteProductIds,
            orders: scopedData.orders,
          };
        }),

      addToCart: (productId) =>
        set((state) => {
          const existing = state.cartItems.find((item) => item.productId === productId);
          const nextCartItems = existing
            ? state.cartItems.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: Math.max(1, item.quantity + 1) }
                  : item,
              )
            : [{ productId, quantity: 1 }, ...state.cartItems];

          return updateCustomerScopedData(state, {
            cartItems: nextCartItems,
          });
        }),

      increaseCartItem: (productId) =>
        set((state) => {
          const nextCartItems = state.cartItems.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.max(1, item.quantity + 1) }
              : item,
          );

          return updateCustomerScopedData(state, {
            cartItems: nextCartItems,
          });
        }),

      decreaseCartItem: (productId) =>
        set((state) => {
          const nextCartItems = state.cartItems
            .map((item) =>
              item.productId === productId
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item,
            )
            .filter((item) => item.quantity > 0);

          return updateCustomerScopedData(state, {
            cartItems: nextCartItems,
          });
        }),

      removeFromCart: (productId) =>
        set((state) => {
          const nextCartItems = state.cartItems.filter((item) => item.productId !== productId);

          return updateCustomerScopedData(state, {
            cartItems: nextCartItems,
          });
        }),

      clearCart: () =>
        set((state) =>
          updateCustomerScopedData(state, {
            cartItems: [],
          }),
        ),

      toggleFavorite: (productId) =>
        set((state) => {
          const nextFavorites = state.favoriteProductIds.includes(productId)
            ? state.favoriteProductIds.filter((id) => id !== productId)
            : [productId, ...state.favoriteProductIds];

          return updateCustomerScopedData(state, {
            favoriteProductIds: nextFavorites,
          });
        }),

      placeOrder: ({ items, customer }) =>
        set((state) => {
          const orderId = Date.now();
          const normalizedItems = items.map((item, index) =>
            normalizeOrderLine({
              ...item,
              lineId: item.lineId || `${orderId}-${index + 1}`,
              status: DEFAULT_ORDER_STATUS,
            }),
          );
          const normalizedCustomer = normalizeCustomer(customer);
          const totalAmount = normalizedItems.reduce(
            (sum, item) => sum + item.totalPrice,
            0,
          );

          const order = {
            id: orderId,
            createdAt: new Date(orderId).toISOString(),
            customer: normalizedCustomer,
            items: normalizedItems,
            totalAmount,
          };

          const groupedByOwner = normalizedItems.reduce<Record<string, OrderLine[]>>(
            (acc, item) => {
              const ownerKey = item.ownerEmail;
              acc[ownerKey] = acc[ownerKey] ? [...acc[ownerKey], item] : [item];
              return acc;
            },
            {},
          );

          const notifications = Object.entries(groupedByOwner).map(
            ([ownerEmail, ownerItems], index) => {
              const id = orderId + index + 1;
              const ownerName = ownerItems[0]?.ownerName ?? "Shop Owner";
              return normalizeNotification({
                id,
                createdAt: new Date(id).toISOString(),
                orderId,
                ownerEmail,
                ownerName,
                customer: normalizedCustomer,
                items: ownerItems,
                totalAmount: ownerItems.reduce((sum, item) => sum + item.totalPrice, 0),
                isRead: false,
              });
            },
          );

          const nextOrders = [order, ...state.orders];

          const scopedUpdate = updateCustomerScopedData(state, {
            orders: nextOrders,
            cartItems: [],
          });

          return {
            ...scopedUpdate,
            orders: nextOrders,
            notifications: [...notifications, ...state.notifications],
            cartItems: [],
          };
        }),

      updateOrderStatus: (lineId, status) =>
        set((state) => {
          const previousLineFromNotifications = state.notifications
            .flatMap((notification) => notification.items)
            .map(normalizeOrderLine)
            .find((item) => item.lineId === lineId);
          const previousLineFromCustomerOrders = Object.values(state.customerDataByEmail)
            .flatMap((data) => data.orders || [])
            .flatMap((order) => order.items)
            .map(normalizeOrderLine)
            .find((item) => item.lineId === lineId);
          const previousLine = previousLineFromNotifications ?? previousLineFromCustomerOrders;
          const previousStatus = previousLine?.status;

          const updateOrdersArray = (ordersToUpdate: PublicCommerceState["orders"]) =>
            ordersToUpdate.map((order) => ({
              ...order,
              customer: normalizeCustomer(order.customer),
              items: order.items.map((item) => {
                const normalized = normalizeOrderLine(item);

                if (normalized.lineId !== lineId) {
                  return normalized;
                }

                return { ...normalized, status };
              }),
            }));

          const orders = updateOrdersArray(state.orders);

          const customerDataByEmail = Object.entries(state.customerDataByEmail).reduce<
            PublicCommerceState["customerDataByEmail"]
          >((accumulator, [email, data]) => {
            accumulator[email] = {
              ...normalizeCustomerData(data),
              orders: updateOrdersArray(data.orders || []),
            };

            return accumulator;
          }, {});

          const notifications = state.notifications.map((notification) => ({
            ...notification,
            customer: normalizeCustomer(notification.customer),
            items: notification.items.map((item) => {
              const normalized = normalizeOrderLine(item);
              return normalized.lineId === lineId
                ? { ...normalized, status }
                : normalized;
            }),
          }));

          const allUpdatedNotificationLines: OrderLine[] = notifications.flatMap(
            (notification) => notification.items,
          );
          const targetLine: OrderLine | undefined = allUpdatedNotificationLines
            .map(normalizeOrderLine)
            .find((item) => item.lineId === lineId);

          if (targetLine && previousStatus && previousStatus !== status) {
            const shouldDeduct = previousStatus !== "Confirmed" && status === "Confirmed";
            const shouldRestore =
              (previousStatus === "Confirmed" && status === "Cancelled") ||
              (previousStatus === "Delivered" && status === "Cancelled");
            const shouldCreateSale = previousStatus !== "Delivered" && status === "Delivered";
            const shouldRemoveSale = previousStatus === "Delivered" && status !== "Delivered";

            if (shouldDeduct) {
              applyInventoryDelta(targetLine, -targetLine.quantity);
            }

            if (shouldRestore) {
              applyInventoryDelta(targetLine, targetLine.quantity);
            }

            if (shouldCreateSale) {
              const matchingNotification = notifications.find((notification) =>
                notification.items.some((item) => normalizeOrderLine(item).lineId === lineId),
              );
              const customerName = matchingNotification?.customer.customerName || "Walk-in Customer";

              useShopOpsStore.getState().addSale({
                ownerEmail: targetLine.ownerEmail,
                customerName,
                productName: targetLine.productName,
                quantity: targetLine.quantity,
                amount: targetLine.totalPrice,
                paymentMethod: "Cash",
                sourceOrderLineId: targetLine.lineId,
              });
            }

            if (shouldRemoveSale) {
              useShopOpsStore.getState().removeSaleBySourceLineId(targetLine.lineId);
            }
          }

          const activeEmail = state.activeCustomerEmail;
          const activeScoped = activeEmail
            ? normalizeCustomerData(customerDataByEmail[activeEmail])
            : emptyCustomerData();

          return {
            orders: activeEmail ? activeScoped.orders : orders,
            notifications,
            customerDataByEmail,
          };
        }),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification,
          ),
        })),

      markAllNotificationsRead: (ownerEmail) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.ownerEmail === ownerEmail.toLowerCase().trim()
              ? { ...notification, isRead: true }
              : notification,
          ),
        })),
    }),
    {
      name: "public-commerce-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        customerDataByEmail: state.customerDataByEmail,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.notifications = (state.notifications || []).map(normalizeNotification);
        state.customerDataByEmail = Object.entries(state.customerDataByEmail || {}).reduce<
          PublicCommerceState["customerDataByEmail"]
        >((accumulator, [email, data]) => {
          accumulator[email.toLowerCase().trim()] = normalizeCustomerData(data);
          return accumulator;
        }, {});

        state.activeCustomerEmail = null;
        state.cartItems = [];
        state.favoriteProductIds = [];
        state.orders = [];
      },
    },
  ),
);
