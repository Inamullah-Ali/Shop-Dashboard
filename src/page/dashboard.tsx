import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { useAuth } from "@/components/login/authContext";
import { ShopDashboard } from "@/components/shop-dashboard";
import { ShopAlerts } from "@/components/shop-alerts";

export default function Dashboard() {
    const { user } = useAuth()

    if (user?.role === "shopAdmin") {
      return <ShopDashboard />
    }

    return (
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
                <div className="@5xl/main:col-span-2">
                  <ChartAreaInteractive />
                </div>
                <div className="@5xl/main:col-span-1">
                  <ShopAlerts />
                </div>
              </div>
              <DataTable/>
            </div>
          </div>
        </div>
    )
}