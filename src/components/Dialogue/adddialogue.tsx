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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

/* ✅ Validation Schema */
const schema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  shopAddress: z.string().min(1, "Shop address is required"),
  city: z.string().min(1, "City is required"),
  shopType: z.string().min(1, "Shop type is required"),
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Role is required"),
  status: z.string().min(1, "Status is required"),
});

type FormData = z.infer<typeof schema>;

export function AddDialogue() {
  const [open, setOpen] = useState(false);

  const {
    // register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("FORM DATA:", data);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
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
              <Input className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
              {errors.shopName && (
                <p className="text-red-500 text-sm">
                  {errors.shopName.message}
                </p>
              )}
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label>Owner Name</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.ownerName && (
                  <p className="text-red-500 text-sm">
                    {errors.ownerName.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label>Phone Number</Label>
                <Input type="number"
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
             <Input className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
              {errors.shopAddress && (
                <p className="text-red-500 text-sm">
                  {errors.shopAddress.message}
                </p>
              )}
            </div>

            <div className="flex flex-row gap-4">
             <div className="flex flex-col gap-1">
                <Label>City</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.city && (
                  <p className="text-red-500 text-sm">{errors.city.message}</p>
                )}
              </div>

             <div className="flex flex-col gap-1">
                <Label>Shop Type</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.shopType && (
                  <p className="text-red-500 text-sm">
                    {errors.shopType.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-row gap-4">
              <div className="flex flex-col gap-1">
                <Label>Email</Label>
                <Input type="email" className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1">
                <Label>Role</Label>
                <Input className="focus-visible:ring-2 focus-visible:ring-offset-0 rounded-sm" />
                {errors.role && (
                  <p className="text-red-500 text-sm">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Account Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
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
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>

            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
