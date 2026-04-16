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
import { useShopOpsStore } from "@/store/shop-ops-store";

export default function CustomersPage() {
  const { user } = useAuth();
  const { customers, addCustomer } = useShopOpsStore();
  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const scopedCustomers = useMemo(
    () => customers.filter((customer) => customer.ownerEmail === ownerEmail),
    [customers, ownerEmail]
  );

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
        </div>
      </div>
    </div>
  );
}
