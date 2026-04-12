import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/billing-utils";
import { useShopStore } from "@/store/shop-store";
import { getPriceFromPlans, usePlanStore } from "@/store/addPlanStore";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export default function Reports() {
  const { shops } = useShopStore();
  const { plans } = usePlanStore();
  const [testDate, setTestDate] = useState("");

  const referenceDate = useMemo(() => {
    if (!testDate) {
      return new Date();
    }

    const parsed = new Date(`${testDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }

    return parsed;
  }, [testDate]);

  const metrics = useMemo(() => {
    const currentMonth = monthKey(referenceDate);

    const prev = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
    const previousMonth = monthKey(prev);

    const paidShops = shops.filter(
      (shop) => shop.paymentStatus === "Received" && shop.paymentDate,
    );

    const currentMonthPayments = paidShops.filter(
      (shop) => monthKey(new Date(shop.paymentDate!)) === currentMonth,
    );

    const previousMonthPayments = paidShops.filter(
      (shop) => monthKey(new Date(shop.paymentDate!)) === previousMonth,
    );

    const getShopAmount = (shop: (typeof shops)[number]) => {
      if (typeof shop.selectedPlanPrice === "number" && shop.selectedPlanPrice > 0) {
        return shop.selectedPlanPrice;
      }
      return getPriceFromPlans(plans, shop.packageDuration);
    };

    const currentRevenue = currentMonthPayments.reduce(
      (sum, shop) => sum + getShopAmount(shop),
      0,
    );

    const previousRevenue = previousMonthPayments.reduce(
      (sum, shop) => sum + getShopAmount(shop),
      0,
    );

    const diff = currentRevenue - previousRevenue;
    const growth =
      previousRevenue > 0 ? ((diff / previousRevenue) * 100).toFixed(1) : "0.0";

    return {
      currentRevenue,
      previousRevenue,
      diff,
      growth,
      currentMonthPayments,
      getShopAmount,
    };
  }, [plans, referenceDate, shops]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">Reports / Analytics</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Test Date</span>
              <Input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="h-9 w-44"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Current Month Revenue</CardTitle>
              </CardHeader>
              <CardContent>Rs. {metrics.currentRevenue}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Previous Month Revenue</CardTitle>
              </CardHeader>
              <CardContent>Rs. {metrics.previousRevenue}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Difference</CardTitle>
              </CardHeader>
              <CardContent>
                Rs. {metrics.diff} ({metrics.growth}%)
              </CardContent>
            </Card>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.currentMonthPayments.length ? (
                  metrics.currentMonthPayments.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell className="font-medium">{shop.shopName}</TableCell>
                      <TableCell>{shop.selectedPlanName ?? shop.packageDuration ?? "-"}</TableCell>
                      <TableCell>{shop.paymentDate ? formatShortDate(shop.paymentDate) : "-"}</TableCell>
                      <TableCell>Rs. {metrics.getShopAmount(shop)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="h-24 text-center" colSpan={4}>
                      No received payments in current month.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
