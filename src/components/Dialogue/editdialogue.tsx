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
import { PencilIcon } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useShopStore } from "@/store/shop-store";
import type { PackageDuration } from "@/types/tabledata";
import { usePlanStore } from "@/store/addPlanStore";

/* ✅ Schema */
const schema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string().min(1),
  phoneNumber: z.string().min(1),
  shopAddress: z.string().min(1),
  city: z.string().min(1),
  shopType: z.string().min(1),
  email: z.string().email(),
  selectedPlanId: z.number().min(1, "Plan is required"),
  status: z.enum(["Active", "Inactive"]),
});

type FormData = z.infer<typeof schema>;

type Props = {
  rowData?: Omit<FormData, "selectedPlanId" | "status"> & {
    id: number;
    image?: string;
    packageDuration?: PackageDuration;
    selectedPlanId?: number;
    selectedPlanName?: string;
    selectedPlanPrice?: number;
    status?: string;
  };
  trigger?: React.ReactNode;
};

export function EditDialogue({ rowData, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { editShop } = useShopStore();
  const { plans } = usePlanStore();

  const getDefaultPlanId = () => {
    if (!rowData) {
      return undefined;
    }

    if (rowData.selectedPlanId) {
      return rowData.selectedPlanId;
    }

    const matchedPlanByLabel = plans.find((plan) => plan.durationLabel === rowData.packageDuration);
    if (matchedPlanByLabel) {
      return matchedPlanByLabel.id;
    }

    const matchedPlan = plans.find(
      (plan) => `${plan.durationMonths} ${plan.planName}` === rowData.selectedPlanName,
    );
    return matchedPlan?.id;
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...rowData,
      selectedPlanId: getDefaultPlanId(),
      status: rowData?.status === "Active" ? "Active" : "Inactive",
    },
  });

  useEffect(() => {
    reset({
      ...rowData,
      selectedPlanId: getDefaultPlanId(),
      status: rowData?.status === "Active" ? "Active" : "Inactive",
    });
    setSelectedImage(null);
  }, [plans, reset, rowData]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

  const onSubmit = async (data: FormData) => {
    const selectedPlan = plans.find((plan) => plan.id === data.selectedPlanId);
    if (!selectedPlan) {
      return;
    }

    const image = selectedImage
      ? await fileToDataUrl(selectedImage)
      : rowData?.image;

    editShop(rowData!.id, {
      ...data,
      selectedPlanId: selectedPlan.id,
      selectedPlanName: `${selectedPlan.durationMonths} ${selectedPlan.planName}`,
      selectedPlanPrice: selectedPlan.price,
      packageDuration: selectedPlan.durationLabel,
      status: data.status,
      image,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="cursor-pointer">
            <PencilIcon className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogDescription>
              Update shop details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-1">
              <Label>Shop Name</Label>
              <Input {...register("shopName")} className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
              {errors.shopName && (
                <p className="text-red-500 text-sm">
                  {errors.shopName.message}
                </p>
              )}
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label>Owner Name</Label>
                <Input {...register("ownerName")} className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm">
                    {errors.ownerName.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label>Phone Number</Label>
                <Input {...register("phoneNumber")}
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

            {/* Address */}
            <div className="flex flex-col gap-1">
              <Label>Shop Address</Label>
              <Input {...register("shopAddress")} className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
              {errors.shopAddress && (
                <p className="text-red-500 text-sm">
                  {errors.shopAddress.message}
                </p>
              )}
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label>City</Label>
                <Input {...register("city")} className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label>Shop Type</Label>
                <Input {...register("shopType")} className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
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

            <div className="flex flex-col gap-1">
              <Label htmlFor="edit-shop-image">Shop Image (optional)</Label>
              {rowData?.image ? (
                <img
                  src={rowData.image}
                  alt={`${rowData.shopName} image`}
                   className="mt-2 h-24 w-24 object-cover rounded-md border"
                />
              ) : null}
              <Input
              className="cursor-pointer"
                id="edit-shop-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedImage(file);
                }}
              />
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

            <div className="flex flex-col gap-1">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="Active">
                        Active
                      </SelectItem>
                      <SelectItem className="cursor-pointer" value="Inactive">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />

              {errors.status && (
                <p className="text-red-500 text-sm">{errors.status.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="cursor-pointer" variant="outline">Cancel</Button>
            </DialogClose>

            <Button className="cursor-pointer" type="submit" disabled={!plans.length}>Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}