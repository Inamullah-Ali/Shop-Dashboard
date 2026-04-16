import { useState } from "react";
import { PlusIcon } from "lucide-react";

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

type ProductFormValues = {
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  discount: number;
};

type AddProductDialogueProps = {
  onAddProduct: (values: ProductFormValues) => void;
};

type ProductFormState = {
  productName: string;
  price: string;
  quantity: string;
  discount: string;
};

const initialFormState: ProductFormState = {
  productName: "",
  price: "",
  quantity: "",
  discount: "0",
};

const parseNonNegativeNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

export function AddProductDialogue({ onAddProduct }: AddProductDialogueProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const resetForm = () => {
    setForm(initialFormState);
    setSelectedImage(null);
    setPreview(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.productName.trim()) {
      return;
    }

    const image = selectedImage ? await fileToDataUrl(selectedImage) : undefined;
    const price = parseNonNegativeNumber(form.price);
    const quantity = Math.trunc(parseNonNegativeNumber(form.quantity));
    const discount = parseNonNegativeNumber(form.discount);

    onAddProduct({
      productName: form.productName,
      productImage: image,
      price,
      quantity,
      discount,
    });

    resetForm();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          <PlusIcon className="size-4" />
          Add Product
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              Fill in the product details to add it to your shop.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
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
              <Label htmlFor="product-image">Product Image</Label>
              <div className="flex items-end gap-2">
                {preview ? (
                  <img
                    src={preview}
                    alt="Product preview"
                    className="h-16 w-16 rounded-md border object-cover"
                  />
                ) : null}
                <Input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setSelectedImage(file);
                    if (file) {
                      setPreview(URL.createObjectURL(file));
                    } else {
                      setPreview(null);
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
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
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
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
              <Label htmlFor="discount">Discount</Label>
              <Input
                id="discount"
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
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
