import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useAuth } from "@/components/login/authContext";
import { NewSaleDialog } from "@/components/new-sale-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProductStore } from "@/store/product-store";
import { useShopOpsStore } from "@/store/shop-ops-store";
import type { PaymentMethod } from "@/types/shop-ops";

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

export function ShopDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products } = useProductStore();
  const { sales, customers } = useShopOpsStore();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("Cash");

  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const scopedProducts = useMemo(
    () => products.filter((product) => product.ownerEmail === ownerEmail),
    [ownerEmail, products]
  );

  const scopedSales = useMemo(
    () => sales.filter((sale) => sale.ownerEmail === ownerEmail),
    [ownerEmail, sales]
  );

  const scopedCustomers = useMemo(
    () => customers.filter((customer) => customer.ownerEmail === ownerEmail),
    [customers, ownerEmail]
  );

  const now = new Date();

  const todaySales = useMemo(
    () =>
      scopedSales.filter((sale) => isSameDay(new Date(sale.createdAt), now)),
    [now, scopedSales]
  );

  const monthSales = useMemo(
    () =>
      scopedSales.filter((sale) => {
        const created = new Date(sale.createdAt);
        return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
      }),
    [now, scopedSales]
  );

  const todayAmount = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
  const monthAmount = monthSales.reduce((sum, sale) => sum + sale.amount, 0);

  const chartData = useMemo(() => {
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(now.getDate() - (6 - index));

      const dayTotal = scopedSales
        .filter((sale) => isSameDay(new Date(sale.createdAt), date))
        .reduce((sum, sale) => sum + sale.amount, 0);

      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        sales: dayTotal,
      };
    });

    return points;
  }, [now, scopedSales]);

  const lowStockProducts = useMemo(
    () => scopedProducts.filter((product) => product.quantity <= 5).sort((a, b) => a.quantity - b.quantity),
    [scopedProducts]
  );

  const recentSales = useMemo(() => scopedSales.slice(0, 6), [scopedSales]);

  const topSellingProducts = useMemo(() => {
    const quantityByProduct = scopedSales.reduce<Record<string, number>>((acc, sale) => {
      acc[sale.productName] = (acc[sale.productName] ?? 0) + sale.quantity;
      return acc;
    }, {});

    return Object.entries(quantityByProduct)
      .map(([name, totalQty]) => ({ name, totalQty }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 5);
  }, [scopedSales]);

  const methodCount = useMemo(
    () =>
      todaySales.reduce<Record<PaymentMethod, number>>(
        (acc, sale) => {
          acc[sale.paymentMethod] += 1;
          return acc;
        },
        { Cash: 0, Card: 0, Credit: 0 }
      ),
    [todaySales]
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Sales</CardDescription>
            <CardTitle>{formatCurrency(todayAmount)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Products</CardDescription>
            <CardTitle>{scopedProducts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Customers</CardDescription>
            <CardTitle>{scopedCustomers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sales (This Month)</CardDescription>
            <CardTitle>{formatCurrency(monthAmount)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Last 7 days sales trend</CardDescription>
          </CardHeader>
          <CardContent className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="shopSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Area type="monotone" dataKey="sales" stroke="var(--primary)" fill="url(#shopSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Products with quantity 5 or less</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStockProducts.length ? (
              lowStockProducts.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="truncate pr-2">{item.productName}</span>
                  <span className="font-semibold text-red-500">{item.quantity}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No low stock products.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today Summary</CardTitle>
            <CardDescription>Track today&apos;s sales and payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <NewSaleDialog ownerEmail={ownerEmail} scopedProducts={scopedProducts} />

            <div className="rounded-md border p-3 text-sm">
              <p>Transactions: {todaySales.length}</p>
              <p>Total Amount: {formatCurrency(todayAmount)}</p>
              <p>Average Sale: {formatCurrency(todaySales.length ? todayAmount / todaySales.length : 0)}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["Cash", "Card", "Credit"] as PaymentMethod[]).map((method) => (
                <Button
                  key={method}
                  variant={selectedPaymentMethod === method ? "default" : "outline"}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className="h-auto flex-col py-2"
                >
                  <span>{method}</span>
                  <span className="text-xs">{methodCount[method]}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPaymentMethod} payments today: {methodCount[selectedPaymentMethod]}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.length ? (
                  recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.productName}</TableCell>
                      <TableCell className="text-right">{sale.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sale.amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                      No sales recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="flex max-h-96 flex-col">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 space-y-2 overflow-y-auto">
            {topSellingProducts.length ? (
              topSellingProducts.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <span className="truncate pr-2 text-sm">{item.name}</span>
                  <span className="text-sm font-semibold">{item.totalQty}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sales data for top products yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Button variant="outline" onClick={() => navigate("/products")}>Add Product</Button>
            <Button variant="outline" onClick={() => navigate("/purchase")}>New Purchase</Button>
            <Button variant="outline" onClick={() => navigate("/customers")}>Add Customer</Button>
            <Button variant="outline" onClick={() => navigate("/reports")}>View Reports</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
