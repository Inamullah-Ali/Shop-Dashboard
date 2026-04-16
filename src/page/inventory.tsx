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
import { useProductStore } from "@/store/product-store";

export default function InventoryPage() {
  const { user } = useAuth();
  const { products } = useProductStore();

  const ownerEmail = user?.email?.toLowerCase() ?? "";

  const scopedProducts = useMemo(
    () => products.filter((product) => product.ownerEmail === ownerEmail),
    [ownerEmail, products]
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Low stock items are products with quantity 5 or less.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Stock Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedProducts.length ? (
                    scopedProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell className="text-right">Rs. {product.price}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right">
                          <span className={product.quantity <= 5 ? "text-red-500 font-semibold" : "text-green-600"}>
                            {product.quantity <= 5 ? "Low" : "Healthy"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No inventory records found.
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
