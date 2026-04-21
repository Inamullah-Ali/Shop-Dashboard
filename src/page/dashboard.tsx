import { useAuth } from "@/components/login/authContext";
import { ModernShopDashboard } from "@/components/modern-shop-dashboard";
import SaasAdminDashboard from "@/components/saas-admin-dashboard";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      {user?.role === "shopAdmin" ? <ModernShopDashboard /> : null}
      {user?.role === "admin" ? <SaasAdminDashboard /> : null}
    </>
  );
}
