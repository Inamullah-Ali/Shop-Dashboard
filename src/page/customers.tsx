import { useMemo, useState } from "react";

import { useAuth } from "@/components/login/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomerStore } from "@/store/customer-store";
import { usePublicCommerceStore } from "@/store/public-commerce-store";
import { useShopOpsStore } from "@/store/shop-ops-store";

export default function CustomersPage() {
  const { user } = useAuth();
  const { customers, addCustomer } = useShopOpsStore();
  const { customers: registeredCustomers } = useCustomerStore();
  const { notifications } = usePublicCommerceStore();
  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const scopedCustomers = useMemo(
    () => customers.filter((customer) => customer.ownerEmail === ownerEmail),
    [customers, ownerEmail]
  );

  const customerTrackingRows = useMemo(() => {
    const orderIndex = new Map<string, { totalOrders: number; totalAmount: number; latestOrder: string }>()

    notifications
      .filter((notification) => notification.ownerEmail === ownerEmail)
      .forEach((notification) => {
        const key = notification.customer.email || notification.customer.customerName.toLowerCase()
        const current = orderIndex.get(key) ?? { totalOrders: 0, totalAmount: 0, latestOrder: "" }

        current.totalOrders += 1
        current.totalAmount += notification.totalAmount
        current.latestOrder = new Date(notification.createdAt).toLocaleDateString()

        orderIndex.set(key, current)
      })

    return registeredCustomers
      .map((customer) => {
        const key = customer.email.toLowerCase().trim()
        const orderStats = orderIndex.get(key) ?? { totalOrders: 0, totalAmount: 0, latestOrder: "-" }

        return {
          ...customer,
          orderStats,
        }
      })
      .filter((customer) => customer.orderStats.totalOrders > 0)
  }, [notifications, ownerEmail, registeredCustomers])

  const handleAddCustomer = () => {
    if (!ownerEmail || !name.trim() || !phone.trim()) {
      return;
    }

    addCustomer({
      ownerEmail,
      name: name.trim(),
      phone: phone.trim(),
    });

    setName("");
    setPhone("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddCustomer}>Add Customer</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedCustomers.length ? (
                    scopedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No customers added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Orders</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Latest Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerTrackingRows.length ? (
                    customerTrackingRows.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          {customer.firstName} {customer.lastName}
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.city}</TableCell>
                        <TableCell className="text-right">{customer.orderStats.totalOrders}</TableCell>
                        <TableCell className="text-right">Rs. {customer.orderStats.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>{customer.orderStats.latestOrder}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No customer orders found yet.
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
