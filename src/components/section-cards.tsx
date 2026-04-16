"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"
import { useShopStore } from "@/store/shop-store"
import { useMemo } from "react"
import { isShopActiveStatus } from "@/lib/package-utils"
import { usePlanStore } from "@/store/addPlanStore"
import { getPriceFromPlans } from "@/lib/plan-utils"

export function SectionCards() {
  const { shops } = useShopStore()
  const { plans } = usePlanStore()

  const stats = useMemo(() => {
    const totalShops = shops.length
    const activeShops = shops.filter(
      (shop) => isShopActiveStatus(shop)
    ).length
    const inactiveShops = shops.filter(
      (shop) => !isShopActiveStatus(shop)
    ).length
    const getShopAmount = (shop: (typeof shops)[number]) =>
      typeof shop.selectedPlanPrice === "number" && shop.selectedPlanPrice > 0
        ? shop.selectedPlanPrice
        : getPriceFromPlans(plans, shop.packageDuration)

    const totalRevenue = shops.reduce(
      (sum, shop) =>
        shop.paymentStatus === "Received"
          ? sum + getShopAmount(shop)
          : sum,
      0,
    )

    return {
      totalShops,
      activeShops,
      inactiveShops,
      totalRevenue,
      totalPercentage: totalShops > 0 ? "100.0" : "0.0",
      activePercentage:
        totalShops > 0 ? ((activeShops / totalShops) * 100).toFixed(1) : "0.0",
      inactivePercentage:
        totalShops > 0 ? ((inactiveShops / totalShops) * 100).toFixed(1) : "0.0",
    }
  }, [plans, shops])

  const cardClass =
    "rounded-2xl bg-white/70 shadow-sm backdrop-blur-md transition hover:shadow-md"

  return (
    <div className="grid grid-cols-1 gap-5 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className={cardClass}>
        <CardHeader>
          <CardDescription>Total Shops</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {stats.totalShops}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="gap-1 bg-blue-50 text-blue-600">
            <TrendingUpIcon className="size-4" />
            {stats.totalPercentage}%
          </Badge>
        </CardContent>
      </Card>

      {/* Active Shops */}
      <Card className={cardClass}>
        <CardHeader>
          <CardDescription>Active Shops</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums text-green-600">
            {stats.activeShops}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="gap-1 bg-green-50 text-green-600">
            <TrendingUpIcon className="size-4" />
            {stats.activePercentage}%
          </Badge>
        </CardContent>
      </Card>

      {/* Inactive Shops */}
      <Card className={cardClass}>
        <CardHeader>
          <CardDescription>Inactive Shops</CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums text-red-500">
            {stats.inactiveShops}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="gap-1 bg-red-50 text-red-500">
            <TrendingDownIcon className="size-4" />
            {stats.inactivePercentage}%
          </Badge>
        </CardContent>
      </Card>

      {/* Revenue */}
      <Card className={cardClass}>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            Rs. {stats.totalRevenue}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className="gap-1 bg-purple-50 text-purple-600">
            <TrendingUpIcon className="size-4" />
            Received
          </Badge>
        </CardContent>
      </Card>

    </div>
  )
}