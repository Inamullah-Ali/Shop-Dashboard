import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShopStore } from "@/store/shop-store";
import { formatShortDate, getBillingStartDate } from "@/lib/billing-utils";
import { usePlanStore } from "@/store/addPlanStore";
import { getPriceFromPlans } from "@/lib/plan-utils";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { IShop } from "@/types/tabledata";

const DAY_MS = 1000 * 60 * 60 * 24;

function getDurationDays(durationLabel?: string) {
  if (!durationLabel) {
    return 30;
  }

  const normalized = durationLabel.trim().toLowerCase();
  const monthMatch = normalized.match(/^(\d+)\s*month(s)?$/);
  if (monthMatch) {
    return Number(monthMatch[1]) * 30;
  }

  const yearMatch = normalized.match(/^(\d+)\s*year(s)?$/);
  if (yearMatch) {
    return Number(yearMatch[1]) * 365;
  }

  return 30;
}

function getPaymentExpiryDate(shop: Pick<IShop, "paymentDate" | "packageDuration">) {
  if (!shop.paymentDate) {
    return null;
  }

  const paymentDate = new Date(shop.paymentDate);
  if (Number.isNaN(paymentDate.getTime())) {
    return null;
  }

  return new Date(paymentDate.getTime() + getDurationDays(shop.packageDuration) * DAY_MS);
}

export default function Payment() {
  const { shops, editShop } = useShopStore();
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

  const getShopAmount = (shop: (typeof shops)[number]) => {
    if (typeof shop.selectedPlanPrice === "number" && shop.selectedPlanPrice > 0) {
      return shop.selectedPlanPrice;
    }
    return getPriceFromPlans(plans, shop.packageDuration);
  };

  const markReceived = (id: number) => {
    editShop(id, {
      paymentStatus: "Received",
      paymentDate: referenceDate.toISOString(),
    });
  };

  const markNotReceived = (id: number) => {
    editShop(id, {
      paymentStatus: "Not Received",
      paymentDate: undefined,
    });
  };

  const printReceipt = (shopId: number) => {
    const shop = shops.find((item) => item.id === shopId);
    if (!shop) {
      return;
    }

    const popup = window.open("", "_blank", "width=800,height=600");
    if (!popup) {
      return;
    }

    popup.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 12px; }
            p { margin: 6px 0; }
          </style>
        </head>
        <body>
          <h1>Payment Receipt</h1>
          <p><strong>Shop:</strong> ${shop.shopName}</p>
          <p><strong>Owner:</strong> ${shop.ownerName}</p>
          <p><strong>Plan:</strong> ${shop.selectedPlanName ?? shop.packageDuration ?? "-"}</p>
          <p><strong>Amount:</strong> Rs. ${getShopAmount(shop)}</p>
          <p><strong>Payment Date:</strong> ${shop.paymentDate ? formatShortDate(shop.paymentDate) : "-"}</p>
        </body>
      </html>
    `);
    popup.document.close();
    popup.print();
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold">Payment</h1>
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

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.length ? (
                  shops.map((shop) => (
                    <TableRow key={shop.id}>
                      {(() => {
                        const billingStart = getBillingStartDate(shop);
                        const isFreeTrialActive = referenceDate < billingStart;
                        const paymentExpiry = getPaymentExpiryDate(shop);
                        const isPaidCycleActive =
                          shop.paymentStatus === "Received" &&
                          paymentExpiry !== null &&
                          referenceDate < paymentExpiry;
                        const statusLabel = isFreeTrialActive
                          ? "Free Trial"
                          : shop.paymentStatus ?? "Not Received";

                        return (
                          <>
                      <TableCell className="font-medium">{shop.shopName}</TableCell>
                      <TableCell>{shop.selectedPlanName ?? shop.packageDuration ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabel === "Received" ? "default" : "outline"}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatShortDate(shop.createdAt ?? shop.id)}</TableCell>
                      <TableCell className="text-right">Rs. {getShopAmount(shop)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {isFreeTrialActive ? null : isPaidCycleActive ? (
                            <Button className="cursor-pointer" size="sm" variant="secondary" onClick={() => printReceipt(shop.id)}>
                              Print
                            </Button>
                          ) : (
                            <>
                              <Button size="sm" onClick={() => markReceived(shop.id)}>
                                Received
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => markNotReceived(shop.id)}>
                                Not Received
                              </Button>
                            </>
                          )}
                        </div>
                        {isFreeTrialActive ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Free month active
                          </p>
                        ) : null}
                      </TableCell>
                          </>
                        );
                      })()}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="h-24 text-center" colSpan={6}>
                      No shops found.
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
