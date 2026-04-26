import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { TooltipProvider } from "./components/ui/tooltip";
import Feature from "./feature/feature";
import Dashboard from "./page/dashboard";
import Setting from "./page/setting";
import Shop from "./page/shop";
import Products from "./page/products";
import Payment from "./page/payment";
import Plans from "./page/plans";
import Reports from "./page/reports";
import SalesPage from "./page/sales";
import InventoryPage from "./page/inventory";
import CustomersPage from "./page/customers";
import PurchasePage from "./page/purchase";
import ExpensePage from "./page/expense";
import { CreditPage } from "./page/credit";
import OrdersPage from "./page/orders";
import { Toaster } from "./components/ui/sonner";
import ProtectedRoute from "./components/login/ProtectedRoute";
import PublicProductsPage from "./page/public-products";
import ResetPasswordPage from "./page/reset-password";
import { useShopStore } from "./store/shop-store";
import { fetchShopsFromAppwrite } from "./service/appwriteShop";
import { usePlanStore } from "./store/addPlanStore";
import { fetchPlansFromAppwrite } from "./service/appwritePlan";
import { useProductStore } from "./store/product-store";
import { fetchProductsFromAppwrite } from "./service/appwriteProduct";
import { toast } from "sonner";
import {
  appwriteClient,
  appwriteDatabaseId,
  appwritePlanCollectionId,
  appwriteProductCollectionId,
  appwriteShopCollectionId,
} from "./lib/appwrite";

function App() {
  const setShops = useShopStore((state) => state.setShops);
  const setPlans = usePlanStore((state) => state.setPlans);
  const setProducts = useProductStore((state) => state.setProducts);

  useEffect(() => {
    let active = true;

    const syncShops = async () => {
      try {
        const shops = await fetchShopsFromAppwrite();

        if (active) {
          setShops(shops);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sync shops from Appwrite");
      }
    };

    void syncShops();

    if (appwriteDatabaseId && appwriteShopCollectionId) {
      const channel = `databases.${appwriteDatabaseId}.collections.${appwriteShopCollectionId}.documents`;

      const unsubscribe = appwriteClient.subscribe(channel, () => {
        void syncShops();
      });

      return () => {
        active = false;
        void unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, [setShops]);

  useEffect(() => {
    let active = true;

    if (!appwriteDatabaseId || !appwritePlanCollectionId) {
      return () => {
        active = false;
      };
    }

    const syncPlans = async () => {
      try {
        const plans = await fetchPlansFromAppwrite();

        if (active) {
          setPlans(plans);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sync plans from Appwrite");
      }
    };

    void syncPlans();

    const channel = `databases.${appwriteDatabaseId}.collections.${appwritePlanCollectionId}.documents`;

    const unsubscribe = appwriteClient.subscribe(channel, () => {
      void syncPlans();
    });

    return () => {
      active = false;
      void unsubscribe();
    };
  }, [setPlans]);

  useEffect(() => {
    let active = true;

    if (!appwriteDatabaseId || !appwriteProductCollectionId) {
      return () => {
        active = false;
      };
    }

    const syncProducts = async () => {
      try {
        const products = await fetchProductsFromAppwrite();

        if (active) {
          setProducts(products);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sync products from Appwrite");
      }
    };

    void syncProducts();

    const channel = `databases.${appwriteDatabaseId}.collections.${appwriteProductCollectionId}.documents`;

    const unsubscribe = appwriteClient.subscribe(channel, () => {
      void syncProducts();
    });

    return () => {
      active = false;
      void unsubscribe();
    };
  }, [setProducts]);

  return (
    <TooltipProvider>
      <Routes>
        <Route index element={<PublicProductsPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route
          element={
            <ProtectedRoute allowedRoles={["admin", "shopAdmin"]}>
              <Feature />
            </ProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "shopAdmin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="shop"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Shop />
              </ProtectedRoute>
            }
          />
          <Route
            path="setting"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Setting />
              </ProtectedRoute>
            }
          />
          <Route
            path="products"
            element={
              <ProtectedRoute allowedRoles={["admin", "shopAdmin"]}>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="payment"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="plans"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Plans />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={["admin", "shopAdmin"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="sales"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <SalesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="customers"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchase"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <PurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="expense"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <ExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="credit"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <CreditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={["shopAdmin"]}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <Toaster position="bottom-center" richColors />
    </TooltipProvider>
  );
}

export default App;
