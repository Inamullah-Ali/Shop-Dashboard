import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { updateProductInAppwrite } from "@/service/appwriteProduct";
import type { Product } from "@/types/product";
import type { PaymentMethod } from "@/types/shop-ops";
import { toast } from "sonner";

type SaleFormItem = {
  productId: string;
  quantity: string;
};

type SelectedSaleItem = SaleFormItem & {
  product: Product;
};

type DiscountMode = "percent" | "amount";

type NewSaleDialogProps = {
  ownerEmail: string;
  scopedProducts: Product[];
  triggerLabel?: string;
  triggerClassName?: string;
};

function createSaleFormItem(productId = ""): SaleFormItem {
  return {
    productId,
    quantity: "1",
  };
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;

function formatCurrency(amount: number) {
  return `Rs. ${amount.toFixed(2)}`;
}

function parseQuantity(value: string) {
  const parsedQuantity = Number(value);

  return Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? Math.trunc(parsedQuantity)
    : 1;
}

export function NewSaleDialog({
  ownerEmail,
  scopedProducts,
  triggerLabel = "New Sale",
  triggerClassName,
}: NewSaleDialogProps) {
  const { addSale, addCredit, updateCredit, credits } = useShopOpsStore();
  const { updateProduct } = useProductStore();

  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);
  const [saleItems, setSaleItems] = useState<SaleFormItem[]>([]);
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountValue, setDiscountValue] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [stockErrorProductId, setStockErrorProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setProductPickerOpen(false);
    setHighlightedProductIndex(0);
    setStockErrorProductId(null);
  }, [open]);

  useEffect(() => {
    const searchTerm = productSearch.trim();

    if (!searchTerm) {
      setProductPickerOpen(false);
      setHighlightedProductIndex(0);
      return;
    }

    setProductPickerOpen(true);
  }, [productSearch]);

  const selectedSaleItems = useMemo<SelectedSaleItem[]>(() => {
    const items: SelectedSaleItem[] = [];

    saleItems.forEach((item) => {
      const product = scopedProducts.find(
        (entry) => String(entry.id) === item.productId,
      );

      if (!product) {
        return;
      }

      items.push({ ...item, product });
    });

    return items;
  }, [saleItems, scopedProducts]);

  const filteredProducts = useMemo(
    () =>
      scopedProducts
        .filter((product) => product.quantity > 0)
        .filter((product) =>
          product.productName
            .toLowerCase()
            .includes(productSearch.trim().toLowerCase()),
        )
        .sort((left, right) =>
          left.productName.localeCompare(right.productName),
        )
        .slice(0, 10),
    [productSearch, scopedProducts],
  );

  useEffect(() => {
    if (!productPickerOpen) {
      return;
    }

    if (!filteredProducts.length) {
      setHighlightedProductIndex(0);
      return;
    }

    setHighlightedProductIndex((current) =>
      Math.min(current, filteredProducts.length - 1),
    );
  }, [filteredProducts.length, productPickerOpen]);

  const saleSubtotal = useMemo(
    () =>
      selectedSaleItems.reduce((sum, item) => {
        const quantity = parseQuantity(item.quantity);
        return sum + roundMoney(item.product.price * quantity);
      }, 0),
    [selectedSaleItems],
  );

  const discountAmount = useMemo(() => {
    const parsedValue = Math.max(0, Number(discountValue) || 0);

    if (!saleSubtotal) {
      return 0;
    }

    const rawDiscount =
      discountMode === "percent"
        ? (saleSubtotal * parsedValue) / 100
        : parsedValue;

    return roundMoney(Math.min(saleSubtotal, Math.max(0, rawDiscount)));
  }, [discountMode, discountValue, saleSubtotal]);

  const saleNetTotal = useMemo(
    () => roundMoney(Math.max(0, saleSubtotal - discountAmount)),
    [saleSubtotal, discountAmount],
  );

  const isProductSelected = (productId: string) =>
    saleItems.some((item) => item.productId === productId);

  const toggleSaleProduct = (productId: string) => {
    const product = scopedProducts.find((entry) => String(entry.id) === productId);

    if (!product || product.quantity <= 0) {
      toast.error("This product is out of stock and cannot be added to a sale.");
      setProductPickerOpen(false);
      return;
    }

    setSaleItems((currentItems) => {
      const alreadySelected = currentItems.some(
        (item) => item.productId === productId,
      );

      if (alreadySelected) {
        return currentItems.filter((item) => item.productId !== productId);
      }

      return [...currentItems, createSaleFormItem(productId)];
    });

    setProductPickerOpen(false);
    setProductSearch("");
    setHighlightedProductIndex(0);
    setStockErrorProductId(null);
  };

  const openProductPicker = () => {
    setProductPickerOpen(true);
    setHighlightedProductIndex(0);
  };

  const closeProductPicker = () => {
    setProductPickerOpen(false);
    setHighlightedProductIndex(0);
  };

  const selectHighlightedProduct = () => {
    const highlightedProduct = filteredProducts[highlightedProductIndex];

    if (!highlightedProduct) {
      return;
    }

    toggleSaleProduct(String(highlightedProduct.id));
  };

  const handleProductSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      !productPickerOpen &&
      (event.key === "ArrowDown" || event.key === "ArrowUp")
    ) {
      openProductPicker();
      return;
    }

    if (!productPickerOpen) {
      return;
    }

    if (!filteredProducts.length) {
      if (event.key === "Escape") {
        setProductPickerOpen(false);
      }

      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedProductIndex(
        (current) => (current + 1) % filteredProducts.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedProductIndex((current) =>
        current === 0 ? filteredProducts.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectHighlightedProduct();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeProductPicker();
    }
  };

  const updateQuantity = (productId: string, quantity: string) => {
    if (stockErrorProductId === productId) {
      setStockErrorProductId(null);
    }

    setSaleItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const removeSaleItem = (productId: string) => {
    if (stockErrorProductId === productId) {
      setStockErrorProductId(null);
    }

    setSaleItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId),
    );
  };

  const resetSaleForm = () => {
    setCustomerName("");
    setProductSearch("");
    setProductPickerOpen(false);
    setHighlightedProductIndex(0);
    setSaleItems([]);
    setDiscountMode("percent");
    setDiscountValue("0");
    setPaymentMethod("Cash");
    setStockErrorProductId(null);
    setOpen(false);
  };

  const addNewSale = async () => {
    if (!ownerEmail || !selectedSaleItems.length) {
      return;
    }

    const outOfStockItem = selectedSaleItems.find((item) => item.product.quantity <= 0);

    if (outOfStockItem) {
      const message = `${outOfStockItem.product.productName} is out of stock and cannot be sold.`;
      setStockErrorProductId(outOfStockItem.productId);
      toast.error(message);
      return;
    }

    // Validate customer name for Credit payment method
    if (paymentMethod === "Credit" && !customerName.trim()) {
      toast.error("Customer name is required for Credit payments");
      return;
    }

    const preparedItems = selectedSaleItems
      .map((item) => {
        const quantity = parseQuantity(item.quantity);

        if (!quantity) {
          return null;
        }

        return {
          product: item.product,
          quantity,
          amount: roundMoney(item.product.price * quantity),
        };
      })
      .filter(
        (
          item,
        ): item is { product: Product; quantity: number; amount: number } =>
          item !== null,
      );

    if (!preparedItems.length) {
      return;
    }

    const insufficientStockItem = preparedItems.find(
      (item) => item.quantity > item.product.quantity,
    );

    if (insufficientStockItem) {
      const availableQuantity = insufficientStockItem.product.quantity;
      const unitLabel = availableQuantity === 1 ? "unit" : "units";
      const message = `Only ${availableQuantity} ${unitLabel} of ${insufficientStockItem.product.productName} are available in stock.`;
      setStockErrorProductId(insufficientStockItem.product.id.toString());
      toast.error(message);
      return;
    }

    const deductionByProduct = preparedItems.reduce<Record<string, number>>(
      (accumulator, item) => {
        const key = item.product.productName.toLowerCase();
        accumulator[key] = (accumulator[key] ?? 0) + item.quantity;
        return accumulator;
      },
      {},
    );

    // Calculate total amount for credit
    const totalSaleAmount = preparedItems.reduce((sum, item) => sum + item.amount, 0);

    // Add individual sales
    preparedItems.forEach((item) => {
      addSale({
        ownerEmail,
        customerName: customerName.trim(),
        productName: item.product.productName,
        quantity: item.quantity,
        amount: item.amount,
        paymentMethod,
      });
    });

    // If payment method is Credit, handle credit tracking
    if (paymentMethod === "Credit") {
      const trimmedCustomerName = customerName.trim();
      
      // Check if an unpaid credit exists for this customer
      const existingUnpaidCredit = credits.find(
        (credit) =>
          credit.ownerEmail === ownerEmail &&
          credit.customerName.toLowerCase() === trimmedCustomerName.toLowerCase() &&
          credit.status !== "Paid"
      );

      if (existingUnpaidCredit) {
        // Update existing unpaid credit by adding new products and amount
        const updatedProducts = [
          ...existingUnpaidCredit.products,
          ...preparedItems.map((item) => ({
            productName: item.product.productName,
            quantity: item.quantity,
            amount: item.amount,
          })),
        ];

        const updatedTotalAmount = existingUnpaidCredit.totalAmount + totalSaleAmount;

        updateCredit(existingUnpaidCredit.id, {
          totalAmount: updatedTotalAmount,
          products: updatedProducts,
          status: existingUnpaidCredit.paidAmount > 0 ? "Partial" : "Unpaid",
        });
      } else {
        // Create a new credit entry
        addCredit({
          ownerEmail,
          customerName: trimmedCustomerName,
          phone: "",
          totalAmount: totalSaleAmount,
          paidAmount: 0,
          status: "Unpaid",
          products: preparedItems.map((item) => ({
            productName: item.product.productName,
            quantity: item.quantity,
            amount: item.amount,
          })),
        });
      }
    }

    const inventoryUpdates = Object.entries(deductionByProduct).map(
      async ([productKey, totalQuantity]) => {
        const productToUpdate = scopedProducts.find(
          (product) => product.productName.toLowerCase() === productKey,
        );

        if (!productToUpdate) {
          return;
        }

        const nextQuantity = Math.max(0, productToUpdate.quantity - totalQuantity);

        await updateProductInAppwrite({
          appwriteDocumentId: productToUpdate.appwriteDocumentId,
          ownerEmail: productToUpdate.ownerEmail,
          productName: productToUpdate.productName,
          updates: {
            productName: productToUpdate.productName,
            productImage: productToUpdate.productImage,
            price: productToUpdate.price,
            quantity: nextQuantity,
            discount: productToUpdate.discount,
          },
        });

        updateProduct(productToUpdate.id, {
          quantity: nextQuantity,
        });
      },
    );

    try {
      await Promise.all(inventoryUpdates);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product inventory in Appwrite");
      return;
    }

    resetSaleForm();
  };

  return (
    <>
      <Button className={triggerClassName ?? "w-full"} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-fit w-7/12 max-w-none overflow-hidden rounded-2xl border-0 p-0 shadow-none sm:max-w-none">
          <div
            className="flex h-full flex-col"
            onMouseDownCapture={() => {
              if (productPickerOpen) {
                closeProductPicker();
              }
            }}
          >
            <DialogHeader className="border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50 px-6 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <DialogTitle className="text-xl text-slate-950">
                    New Sale
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-slate-500">
                    Build a cart, review the totals, and complete the sale from
                    this modal.
                  </DialogDescription>
                </div>
                <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm shadow-blue-600/20">
                  {selectedSaleItems.length} item
                  {selectedSaleItems.length === 1 ? "" : "s"}
                </div>
              </div>
            </DialogHeader>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1.5fr_0.95fr]">
              {/* LEFT SIDE */}
              <div className="min-h-0 overflow-y-auto space-y-3 border-r bg-white p-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    placeholder="Select Product"
                    className="h-11 rounded-xl pl-10"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setHighlightedProductIndex(0);
                    }}
                    onKeyDown={handleProductSearchKeyDown}
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Out-of-stock products are hidden and cannot be added.
                  </p>

                  {productPickerOpen ? (
                    <div
                      className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                      data-product-picker
                    >
                      <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.length ? (
                          filteredProducts.map((product) => {
                            const selected = isProductSelected(
                              String(product.id),
                            );
                            const isHighlighted =
                              filteredProducts[highlightedProductIndex]?.id ===
                              product.id;

                            return (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() =>
                                  toggleSaleProduct(String(product.id))
                                }
                                className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50 ${selected ? "bg-blue-50/70" : ""} ${isHighlighted ? "bg-slate-100" : ""}`}
                              >
                                <span className="font-medium text-slate-900">
                                  {product.productName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatCurrency(product.price)}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-6 text-center text-sm text-slate-500">
                            No matching products found.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-slate-50">
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-center">
                            Quantity
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Remove</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSaleItems.length ? (
                          selectedSaleItems.map((item) => {
                            const quantity = parseQuantity(item.quantity);
                            const total = roundMoney(
                              item.product.price * quantity,
                            );
                            const hasStockError =
                              stockErrorProductId === item.productId;

                            return (
                              <TableRow
                                key={item.productId}
                                className={hasStockError ? "bg-red-50/40" : ""}
                              >
                                <TableCell
                                  className={`font-medium ${hasStockError ? "border-y-2 border-l-2 border-red-400" : ""}`}
                                >
                                  {item.product.productName}
                                </TableCell>
                                <TableCell
                                  className={`text-right ${hasStockError ? "border-y-2 border-red-500" : ""}`}
                                >
                                  {formatCurrency(item.product.price)}
                                </TableCell>
                                <TableCell
                                  className={`text-center ${hasStockError ? "border-y-2 border-red-400" : ""}`}
                                >
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.quantity}
                                    onFocus={(e) => e.currentTarget.select()}
                                    onClick={(e) => e.currentTarget.select()}
                                    onChange={(e) =>
                                      updateQuantity(
                                        item.productId,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Qty"
                                    className="h-6 w-14 rounded-sm text-center focus-visible:ring-2 focus-visible:ring-offset-0"
                                  />
                                </TableCell>
                                <TableCell
                                  className={`text-right font-medium ${hasStockError ? "border-y-2 border-red-400" : ""}`}
                                >
                                  {formatCurrency(total)}
                                </TableCell>
                                <TableCell
                                  className={`text-right ${hasStockError ? "border-y-2 border-r-2 border-red-400" : ""}`}
                                >
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={() =>
                                      removeSaleItem(item.productId)
                                    }
                                    aria-label={`Remove ${item.product.productName}`}
                                  >
                                    <X className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-6 text-center text-sm text-slate-500"
                            >
                              Search and add products to build the sale.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Selected Items Table */}
                {/* Customer */}
                <div className="space-y-1.5">
                  <Input
                    placeholder={paymentMethod === "Credit" ? "Customer Name (required)" : "Customer Name (optional)"}
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                    }}
                    className="h-10 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Payment Method
                  </h3>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      setPaymentMethod(value as PaymentMethod);
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-lg">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* RIGHT SIDE */}
              <div>
                <div className="space-y-3 bg-white p-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Sale Summary
                  </h3>

                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(saleSubtotal)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Discount
                    </h4>
                    <div className="flex gap-2">
                      <Select
                        value={discountMode}
                        onValueChange={(value) =>
                          setDiscountMode(value as DiscountMode)
                        }
                      >
                        <SelectTrigger className="w-24 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="amount">Rs</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        type="text"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Total Discount</span>
                    <span>{formatCurrency(discountAmount)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-lg">
                    <span>Net Total</span>
                    <span>{formatCurrency(saleNetTotal)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Payment
                    </h4>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {paymentMethod}
                    </div>
                  </div>

                  <Button
                    className="h-10 w-full rounded-lg bg-blue-600 hover:bg-blue-700"
                    onClick={addNewSale}
                  >
                    Complete Sale
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
