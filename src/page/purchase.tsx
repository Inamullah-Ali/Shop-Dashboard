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

export default function PurchasePage() {
  const { user } = useAuth();
  const { purchases, addPurchase } = useShopOpsStore();
  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const [supplierName, setSupplierName] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amount, setAmount] = useState("");

  const scopedPurchases = useMemo(
    () => purchases.filter((purchase) => purchase.ownerEmail === ownerEmail),
    [ownerEmail, purchases]
  );

  const handleAddPurchase = () => {
    if (!ownerEmail || !supplierName.trim() || !itemName.trim() || !amount) {
      return;
    }

    addPurchase({
      ownerEmail,
      supplierName: supplierName.trim(),
      itemName: itemName.trim(),
      quantity: Number(quantity) || 1,
      amount: Number(amount) || 0,
    });

    setSupplierName("");
    setItemName("");
    setQuantity("1");
    setAmount("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>New Purchase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Supplier</Label>
                  <Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Item</Label>
                  <Input value={itemName} onChange={(event) => setItemName(event.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleAddPurchase}>Save Purchase</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedPurchases.length ? (
                    scopedPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{purchase.supplierName}</TableCell>
                        <TableCell>{purchase.itemName}</TableCell>
                        <TableCell className="text-right">{purchase.quantity}</TableCell>
                        <TableCell className="text-right">Rs. {purchase.amount}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No purchases added yet.
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
