import { useMemo } from "react";

import { useAuth } from "@/components/login/authContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShopOpsStore } from "@/store/shop-ops-store";

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

export default function SalesPage() {
  const { user } = useAuth();
  const { sales } = useShopOpsStore();

  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const scopedSales = useMemo(
    () => sales.filter((sale) => sale.ownerEmail === ownerEmail),
    [ownerEmail, sales]
  );

  const totalSales = scopedSales.reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transactions: {scopedSales.length} | Total: {formatCurrency(totalSales)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedSales.length ? (
                    scopedSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{sale.customerName}</TableCell>
                        <TableCell>{sale.productName}</TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell>{sale.paymentMethod}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No sales added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
