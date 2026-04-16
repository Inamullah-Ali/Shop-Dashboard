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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useShopStore } from "@/store/shop-store";
import { usePlanStore } from "@/store/addPlanStore";
import { addShopSchema, type AddShopFormData } from "./shop-dialog-schema";

export function AddDialogue() {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { addShop } = useShopStore();
  const { plans } = usePlanStore();
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddShopFormData>({
    resolver: zodResolver(addShopSchema),
    defaultValues: {
      selectedPlanId: undefined,
    },
  });

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const onSubmit = async (data: AddShopFormData) => {
    const selectedPlan = plans.find((plan) => plan.id === data.selectedPlanId);
    if (!selectedPlan) {
      return;
    }

    const image = selectedImage
      ? await fileToDataUrl(selectedImage)
      : undefined;

    addShop({
      ...data,
      role: "shopAdmin",
      selectedPlanId: selectedPlan.id,
      selectedPlanName: `${selectedPlan.durationMonths} ${selectedPlan.planName}`,
      selectedPlanPrice: selectedPlan.price,
      packageDuration: selectedPlan.durationLabel,
      status: "Inactive",
      image,
    });
    reset();
    setSelectedImage(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline">
          <PlusIcon />
          <span className="hidden lg:inline">Add Shop</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Shop</DialogTitle>
            <DialogDescription>
              Fill all required fields. Missing fields will show errors.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1">
              <Label>Shop Name</Label>
              <Input
                {...register("shopName")}
                className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
              />
              {errors.shopName && (
                <p className="text-red-500 text-sm">
                  {errors.shopName.message}
                </p>
              )}
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label>Owner Name</Label>
                <Input
                  {...register("ownerName")}
                  className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm">
                    {errors.ownerName.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label>Phone Number</Label>
                <Input
                  {...register("phoneNumber")}
                  type="text"
                  onChange={(e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, "");
                  }}
                  className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Shop Address</Label>
              <Input
                {...register("shopAddress")}
                className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
              />
              {errors.shopAddress && (
                <p className="text-red-500 text-sm">
                  {errors.shopAddress.message}
                </p>
              )}
            </div>
            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label>City</Label>
                <Input
                  {...register("city")}
                  className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label>Shop Type</Label>
                <Input
                  {...register("shopType")}
                  className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
                />
                {errors.shopType && (
                  <p className="text-red-500 text-sm">
                    {errors.shopType.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Email</Label>
              <Input
                type="email"
                {...register("email")}
                className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

<div className="flex flex-row gap-4">
            <div className="flex flex-col gap-1">
              <Label>Password</Label>
              <Input
                type="text"
                {...register("password")}
                className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Plan</Label>
              <Controller
                control={control}
                name="selectedPlanId"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : undefined}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem className="cursor-pointer" key={plan.id} value={String(plan.id)}>
                          {plan.durationMonths} {plan.planName} - Rs. {plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {!plans.length ? (
                <p className="text-amber-600 text-sm">
                  No plans found. Add a plan first from the Plans page.
                </p>
              ) : null}

              {errors.selectedPlanId && (
                <p className="text-red-500 text-sm">{errors.selectedPlanId.message}</p>
              )}
            </div>
</div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="shop-image">Shop Image (optional)</Label>
              <div className="flex flex-row gap-1 items-end">
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 h-20 w-24 object-cover rounded-md border"
                />
              )}
              <Input
              className="cursor-pointer"
                id="shop-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedImage(file);
                  if (file) {
                    const imageUrl = URL.createObjectURL(file);
                    setPreview(imageUrl);
                  } else {
                    setPreview(null);
                  }
                }}
              />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="cursor-pointer"
                onClick={() => {
                  reset({ selectedPlanId: undefined });
                  setSelectedImage(null);
                  setPreview(null);
                  setOpen(false);
                }}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>

            <Button className="cursor-pointer" type="submit" disabled={!plans.length}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
