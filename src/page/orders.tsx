import { useMemo, useState } from "react";

import { useAuth } from "@/components/login/authContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePublicCommerceStore } from "@/store/public-commerce-store";
import { ChevronDown, CircleCheckBig, CircleX, MoreHorizontal, Truck } from "lucide-react";

import type { OrderStatus, ShopOrderNotification } from "@/types/public-commerce";

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

function formatShopStatus(status: OrderStatus) {
  return status;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const { notifications, updateOrderStatus } = usePublicCommerceStore();
  const [selectedOrder, setSelectedOrder] = useState<ShopOrderNotification | null>(null);

  const ownerEmail = user?.email?.toLowerCase().trim() ?? "";

  const scopedNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => notification.ownerEmail === ownerEmail,
      ),
    [notifications, ownerEmail],
  );

  const orderRows = useMemo(
    () =>
      scopedNotifications.flatMap((notification) =>
        notification.items.map((item) => ({
          ...item,
          orderId: notification.orderId,
          notificationId: notification.id,
          customer: notification.customer,
          createdAt: notification.createdAt,
        })),
      ),
    [scopedNotifications],
  );

  const totalAmount = orderRows.reduce((sum, row) => sum + row.totalPrice, 0);
  const pendingCount = orderRows.filter((row) => row.status === "Processing").length;
  const confirmedCount = orderRows.filter((row) => row.status === "Confirmed").length;
  const completedCount = orderRows.filter((row) => row.status === "Delivered").length;
  const customerCount = new Map(
    scopedNotifications.map((notification) => [notification.customer.email || notification.customer.customerName, notification.customer]),
  ).size;

  const selectedOrderRows = useMemo(
    () =>
      selectedOrder
        ? orderRows.filter((row) => row.orderId === selectedOrder.orderId)
        : [],
    [orderRows, selectedOrder],
  );

  const handleStatusChange = (lineId: string, status: OrderStatus) => {
    updateOrderStatus(lineId, status);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm text-muted-foreground">Total orders</p>
                <p className="text-2xl font-semibold">{orderRows.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-semibold">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-semibold">{confirmedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-2xl font-semibold">{completedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-semibold">{customerCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Orders</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customer orders routed to your shop.
                </p>
              </div>
              <Badge variant="secondary">{formatCurrency(totalAmount)}</Badge>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderRows.length ? (
                    orderRows.map((row) => (
                      <TableRow key={`${row.orderId}-${row.lineId}`}>
                        <TableCell>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-left font-medium"
                            onClick={() => setSelectedOrder(scopedNotifications.find((notification) => notification.orderId === row.orderId) ?? null)}
                          >
                            {row.customer.customerName}
                          </Button>
                        </TableCell>
                        <TableCell>{row.customer.email || "-"}</TableCell>
                        <TableCell>{row.customer.city || "-"}</TableCell>
                        <TableCell>{row.customer.phone}</TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell className="text-right">{row.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalPrice)}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === "Cancelled" ? "destructive" : "outline"}>
                            {formatShopStatus(row.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="outline" size="sm">
                                <MoreHorizontal className="size-4" />
                                Action
                                <ChevronDown className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                disabled={!(row.status === "Processing" || row.status === "Cancelled")}
                                onSelect={() => handleStatusChange(row.lineId, "Confirmed")}
                              >
                                <CircleCheckBig className="size-4" />
                                Confirm Order
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={row.status === "Cancelled"}
                                onSelect={() => handleStatusChange(row.lineId, "Cancelled")}
                              >
                                <CircleX className="size-4" />
                                {row.status === "Delivered" ? "Mark Returned" : "Cancel Order"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={row.status !== "Confirmed"}
                                onSelect={() => handleStatusChange(row.lineId, "Delivered")}
                              >
                                <Truck className="size-4" />
                                Mark Delivered
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        No orders added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Drawer open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DrawerContent>
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle>{selectedOrder?.customer.customerName}</DrawerTitle>
            <DrawerDescription>Full customer details and order summary.</DrawerDescription>
          </DrawerHeader>

          {selectedOrder ? (
            <div className="space-y-4 p-4">
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrder.customer.customerName}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.customer.email || "-"}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.customer.phone}</p>
                  <p><span className="font-medium">Address:</span> {selectedOrder.customer.address}</p>
                  <p><span className="font-medium">City:</span> {selectedOrder.customer.city || "-"}</p>
                  {selectedOrder.customer.note ? (
                    <p><span className="font-medium">Note:</span> {selectedOrder.customer.note}</p>
                  ) : null}
                  <p><span className="font-medium">Order ID:</span> {selectedOrder.orderId}</p>
                  <p><span className="font-medium">Placed:</span> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedOrderRows.map((item) => (
                    <div key={item.lineId} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-muted-foreground">Qty {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p>{formatCurrency(item.totalPrice)}</p>
                        <Badge variant={item.status === "Cancelled" ? "destructive" : "outline"}>
                          {formatShopStatus(item.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
