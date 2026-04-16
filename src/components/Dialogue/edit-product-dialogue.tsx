import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/product";

type ProductFormValues = {
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  discount: number;
};

type EditProductDialogueProps = {
  product: Product;
  onUpdateProduct: (id: number, values: ProductFormValues) => void;
};

type ProductFormState = {
  productName: string;
  price: string;
  quantity: string;
  discount: string;
};

const parseNonNegativeNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

export function EditProductDialogue({ product, onUpdateProduct }: EditProductDialogueProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>({
    productName: product.productName,
    price: String(product.price),
    quantity: String(product.quantity),
    discount: String(product.discount),
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(product.productImage ?? null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      productName: product.productName,
      price: String(product.price),
      quantity: String(product.quantity),
      discount: String(product.discount),
    });
    setSelectedImage(null);
    setPreview(product.productImage ?? null);
  }, [open, product]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.productName.trim()) {
      return;
    }

    const image = selectedImage ? await fileToDataUrl(selectedImage) : product.productImage;
    const price = parseNonNegativeNumber(form.price);
    const quantity = Math.trunc(parseNonNegativeNumber(form.quantity));
    const discount = parseNonNegativeNumber(form.discount);

    onUpdateProduct(product.id, {
      productName: form.productName,
      productImage: image,
      price,
      quantity,
      discount,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          <PencilIcon className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`edit-product-name-${product.id}`}>Product Name</Label>
              <Input
                id={`edit-product-name-${product.id}`}
                value={form.productName}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    productName: event.target.value,
                  }))
                }
                className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor={`edit-product-image-${product.id}`}>Product Image</Label>
              <div className="flex items-end gap-2">
                {preview ? (
                  <img
                    src={preview}
                    alt="Product preview"
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                ) : null}
                <Input
                  id={`edit-product-image-${product.id}`}
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedImage(file);
                    if (file) {
                      setPreview(URL.createObjectURL(file));
                    } else {
                      setPreview(product.productImage ?? null);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`edit-price-${product.id}`}>Price</Label>
                <Input
                  id={`edit-price-${product.id}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      price: event.target.value,
                    }))
                  }
                  className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor={`edit-quantity-${product.id}`}>Quantity</Label>
                <Input
                  id={`edit-quantity-${product.id}`}
                  type="number"
                  min={0}
                  step="1"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      quantity: event.target.value,
                    }))
                  }
                  className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor={`edit-discount-${product.id}`}>Discount</Label>
              <Input
                id={`edit-discount-${product.id}`}
                type="number"
                min={0}
                step="0.01"
                value={form.discount}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    discount: event.target.value,
                  }))
                }
                className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" className="cursor-pointer">
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
