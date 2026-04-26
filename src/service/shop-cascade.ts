import type { PublicOrder } from "@/types/public-commerce";
import type { IShop } from "@/types/tabledata";
import { useProductStore } from "@/store/product-store";
import { usePublicCommerceStore } from "@/store/public-commerce-store";
import { useShopOpsStore } from "@/store/shop-ops-store";
import { deleteImageFromAppwrite } from "@/service/appwriteStorage";

const filterOrdersForOwner = (orders: PublicOrder[], ownerEmail: string) =>
  orders
    .map((order) => {
      const nextItems = order.items.filter((item) => item.ownerEmail !== ownerEmail);
      if (!nextItems.length) {
        return null;
      }

      return {
        ...order,
        items: nextItems,
        totalAmount: nextItems.reduce((sum, item) => sum + item.totalPrice, 0),
      };
    })
    .filter((order): order is PublicOrder => Boolean(order));

export async function purgeShopRelatedLocalData(shop: IShop) {
  const ownerEmail = shop.email.toLowerCase().trim();
  const productsToRemove = useProductStore
    .getState()
    .products.filter((product) => product.ownerEmail === ownerEmail);

  await Promise.allSettled([
    deleteImageFromAppwrite(shop.image),
    ...productsToRemove.map((product) => deleteImageFromAppwrite(product.productImage)),
  ]);

  const removedProductIds = new Set(productsToRemove.map((product) => product.id));

  useProductStore.setState((state) => ({
    products: state.products.filter((product) => product.ownerEmail !== ownerEmail),
  }));

  usePublicCommerceStore.setState((state) => {
    const orders = filterOrdersForOwner(state.orders, ownerEmail);

    const customerDataByEmail = Object.entries(state.customerDataByEmail).reduce(
      (accumulator, [email, data]) => {
        accumulator[email] = {
          ...data,
          cartItems: data.cartItems.filter((item) => !removedProductIds.has(item.productId)),
          favoriteProductIds: data.favoriteProductIds.filter((id) => !removedProductIds.has(id)),
          orders: filterOrdersForOwner(data.orders, ownerEmail),
        };

        return accumulator;
      },
      {} as typeof state.customerDataByEmail,
    );

    return {
      cartItems: state.cartItems.filter((item) => !removedProductIds.has(item.productId)),
      favoriteProductIds: state.favoriteProductIds.filter((id) => !removedProductIds.has(id)),
      orders,
      notifications: state.notifications.filter(
        (notification) => notification.ownerEmail !== ownerEmail,
      ),
      customerDataByEmail,
    };
  });

  useShopOpsStore.setState((state) => ({
    sales: state.sales.filter((entry) => entry.ownerEmail !== ownerEmail),
    credits: state.credits.filter((entry) => entry.ownerEmail !== ownerEmail),
    customers: state.customers.filter((entry) => entry.ownerEmail !== ownerEmail),
    purchases: state.purchases.filter((entry) => entry.ownerEmail !== ownerEmail),
    expenses: state.expenses.filter((entry) => entry.ownerEmail !== ownerEmail),
  }));
}