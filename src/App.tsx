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
import { Toaster } from "./components/ui/sonner";
import UnProtectedRoute from "./components/login/unProtexted";
import LoginPage from "./page/loginpage";
import ProtectedRoute from "./components/login/ProtectedRoute";

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route
          index
          element={
            <UnProtectedRoute>
              <LoginPage />
            </UnProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "shopAdmin"]}>
              <Feature />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
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
        </Route>
      </Routes>
      <Toaster position="bottom-center" richColors />
    </TooltipProvider>
  );
}

export default App;
