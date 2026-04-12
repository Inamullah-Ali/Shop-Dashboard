"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useShopStore } from "@/store/shop-store"
import { getDerivedShopStatus } from "@/lib/package-utils"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  active: {
    label: "Active Shops",
    color: "var(--primary)",
  },
  inactive: {
    label: "Inactive Shops",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const { shops } = useShopStore()
  const [timeRange, setTimeRange] = React.useState("7d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = React.useMemo(() => {
    if (shops.length === 0) {
      return []
    }

    const now = new Date()
    const dates: { [key: string]: { active: number; inactive: number } } = {}

    // Generate date range based on timeRange
    let daysToShow = 90
    if (timeRange === "30d") {
      daysToShow = 30
    } else if (timeRange === "7d") {
      daysToShow = 7
    }

    // Create array of dates
    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      dates[dateStr] = { active: 0, inactive: 0 }
    }

    // Count shops by creation date and status
    shops.forEach((shop) => {
      const shopDate = new Date(shop.id)
      const dateStr = shopDate.toISOString().split("T")[0]
      
      if (dates[dateStr]) {
        if (getDerivedShopStatus(shop) !== "Inactive") {
          dates[dateStr].active += 1
        } else {
          dates[dateStr].inactive += 1
        }
      }
    })

    // Convert to array and calculate cumulative counts
    let cumulativeActive = 0
    let cumulativeInactive = 0

    return Object.entries(dates).map(([date, counts]) => {
      cumulativeActive += counts.active
      cumulativeInactive += counts.inactive
      return {
        date,
        active: cumulativeActive,
        inactive: cumulativeInactive,
      }
    })
  }, [shops, timeRange])

  const filteredData = chartData

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Shop Growth Trend</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Active vs Inactive shops over time
          </span>
          <span className="@[540px]/card:hidden">Shop trends</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-62.5 w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-active)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-active)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillInactive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-inactive)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-inactive)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="inactive"
              type="natural"
              fill="url(#fillInactive)"
              stroke="var(--color-inactive)"
              stackId="a"
            />
            <Area
              dataKey="active"
              type="natural"
              fill="url(#fillActive)"
              stroke="var(--color-active)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
