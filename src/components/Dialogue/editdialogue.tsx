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

/* ✅ Schema */
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

/* 👇 EDIT PROP */
type Props = {
  rowData?: FormData;
  onSave?: (data: FormData) => void;
};

export function EditDialogue({ rowData, onSave }: Props) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: rowData,
  });

  /* 🔥 update form when row changes */
  useEffect(() => {
    reset(rowData);
  }, [rowData, reset]);

  const onSubmit = (data: FormData) => {
    onSave?.(data);
    reset(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <DialogTrigger asChild>
        <Button className="bg-transparent cursor-pointer hover:bg-muted" variant={"outline"}>
          <PencilIcon className="w-4 h-4" color="black" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogDescription>
              Update shop details and save changes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">

            {/* Shop Name */}
            <div>
              <Label>Shop Name</Label>
              <Input {...register("shopName")} />
              {errors.shopName && <p className="text-red-500 text-sm">{errors.shopName.message}</p>}
            </div>

            {/* Owner + Phone */}
            <div className="flex gap-4">
              <div>
                <Label>Owner Name</Label>
                <Input {...register("ownerName")} />
                {errors.ownerName && <p className="text-red-500 text-sm">{errors.ownerName.message}</p>}
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input {...register("phoneNumber")} />
                {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <Label>Shop Address</Label>
              <Input {...register("shopAddress")} />
            </div>

            {/* City + Type */}
            <div className="flex gap-4">
              <div>
                <Label>City</Label>
                <Input {...register("city")} />
              </div>

              <div>
                <Label>Shop Type</Label>
                <Input {...register("shopType")} />
              </div>
            </div>

            {/* Email + Role */}
            <div className="flex gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
              </div>

              <div>
                <Label>Role</Label>
                <Input {...register("role")} />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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

            <Button type="submit">Update</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}