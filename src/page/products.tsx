import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/login/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AddProductDialogue } from "@/components/Dialogue/add-product-dialogue";
import { EditProductDialogue } from "@/components/Dialogue/edit-product-dialogue";
import { DeleteProductDialogue } from "@/components/Dialogue/delete-product-dialogue";
import { useProductStore } from "@/store/product-store";
import { AlertTriangle } from "lucide-react";

type ProductFormValues = {
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  discount: number;
};

const BULK_DELETE_TOAST_ID = "bulk-delete-products-confirmation";

export default function Products() {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore();
  const isAdmin = user?.role === "admin";

  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});

  const visibleProducts = useMemo(() => {
    const scopedProducts = isAdmin
      ? products
      : products.filter((product) => product.ownerEmail === (user?.email ?? "").toLowerCase());

    const query = search.trim().toLowerCase();
    if (!query) {
      return scopedProducts;
    }

    return scopedProducts.filter((product) => {
      if (product.productName.toLowerCase().includes(query)) {
        return true;
      }

      if (!isAdmin) {
        return false;
      }

      return (
        product.ownerName.toLowerCase().includes(query) ||
        product.ownerEmail.toLowerCase().includes(query)
      );
    });
  }, [isAdmin, products, search, user?.email]);

  const allVisibleSelected =
    visibleProducts.length > 0 &&
    visibleProducts.every((product) => selectedRows[product.id]);

  const someVisibleSelected =
    visibleProducts.some((product) => selectedRows[product.id]) &&
    !allVisibleSelected;

  const toggleSelectAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedRows((previous) => {
        const next = { ...previous };
        visibleProducts.forEach((product) => {
          delete next[product.id];
        });
        return next;
      });
      return;
    }

    setSelectedRows((previous) => {
      const next = { ...previous };
      visibleProducts.forEach((product) => {
        next[product.id] = true;
      });
      return next;
    });
  };

  const toggleSingleSelection = (id: number, checked: boolean) => {
    setSelectedRows((previous) => {
      if (!checked) {
        const next = { ...previous };
        delete next[id];
        return next;
      }

      return {
        ...previous,
        [id]: true,
      };
    });
  };

  const selectedProductIds = useMemo(
    () =>
      Object.entries(selectedRows)
        .filter(([, selected]) => Boolean(selected))
        .map(([id]) => Number(id))
        .filter((id) => products.some((product) => product.id === id)),
    [products, selectedRows],
  );

  const handleDeleteSelectedProducts = useCallback(() => {
    if (!selectedProductIds.length) {
      return;
    }

    selectedProductIds.forEach((id) => {
      deleteProduct(id);
    });

    setSelectedRows((previous) => {
      const next = { ...previous };
      selectedProductIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });

    toast.dismiss(BULK_DELETE_TOAST_ID);
  }, [deleteProduct, selectedProductIds]);

  const handleCancelDelete = useCallback(() => {
    setSelectedRows({});
    toast.dismiss(BULK_DELETE_TOAST_ID);
  }, []);

  useEffect(() => {
    if (!selectedProductIds.length) {
      toast.dismiss(BULK_DELETE_TOAST_ID);
      return;
    }

    const count = selectedProductIds.length;
    const countLabel = count === 1 ? "1 product selected" : `${count} products selected`;

    toast.custom(
      () => (
        <div className="w-full rounded-lg border border-red-100 bg-red-100 px-4 py-3 text-red-500 shadow-sm">
          <p className="text-sm font-semibold"><AlertTriangle /> Are you sure you want to delete the product(s)?</p>
          <p className="mt-1 text-xs">{countLabel}</p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-red-300 bg-white text-red-500 hover:bg-red-100 cursor-pointer rounded-sm"
              onClick={handleCancelDelete}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 bg-red-500 text-white hover:bg-red-600 cursor-pointer rounded-sm"
              onClick={handleDeleteSelectedProducts}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      {
        id: BULK_DELETE_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
        classNames: {
          toast: "bg-transparent p-0 shadow-none border-0",
        },
      },
    );
  }, [handleCancelDelete, handleDeleteSelectedProducts, selectedProductIds]);

  useEffect(() => {
    return () => {
      toast.dismiss(BULK_DELETE_TOAST_ID);
    };
  }, []);

  const handleAddProduct = (values: ProductFormValues) => {
    if (!user) {
      return;
    }

    addProduct({
      ownerEmail: user.email,
      ownerName: user.name,
      ...values,
    });
  };

  const handleUpdateProduct = (id: number, values: ProductFormValues) => {
    updateProduct(id, values);
  };
  
  useEffect(() => {
    return () => {
      toast.dismiss(BULK_DELETE_TOAST_ID);
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Products</h1>
              <p className="text-sm text-muted-foreground">
                Add and manage products from your dashboard.
              </p>
            </div>
            {user?.role === "shopAdmin" ? (
              <AddProductDialogue onAddProduct={handleAddProduct} />
            ) : null}
          </div>

          <div className="px-4 lg:px-6">
            <Input
              placeholder={isAdmin ? "Search by product, owner, or email" : "Search products by name"}
              className="max-w-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 mx-4 lg:mx-6">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected || (someVisibleSelected && "indeterminate")}
                      onCheckedChange={(value) => toggleSelectAllVisible(!!value)}
                    />
                  </TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  {isAdmin ? <TableHead>Shop Owner</TableHead> : null}
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleProducts.length ? (
                  visibleProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!selectedRows[product.id]}
                          onCheckedChange={(value) =>
                            toggleSingleSelection(product.id, !!value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {product.productImage ? (
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="h-10 w-10 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md border bg-muted" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      {isAdmin ? (
                        <TableCell>
                          <div className="min-w-40">
                            <p className="truncate font-medium">{product.ownerName}</p>
                            <p className="truncate text-xs text-muted-foreground">{product.ownerEmail}</p>
                          </div>
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right">Rs. {product.price}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">{product.discount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditProductDialogue
                            product={product}
                            onUpdateProduct={handleUpdateProduct}
                          />
                          <DeleteProductDialogue
                            productName={product.productName}
                            onDelete={() => deleteProduct(product.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="h-24 text-center text-muted-foreground">
                      No products found.
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