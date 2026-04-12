import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { usePlanStore } from "@/store/addPlanStore";
import { formatShortDate } from "@/lib/billing-utils";
import { useShopStore } from "@/store/shop-store";

const planSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  durationMonths: z.number().int().min(1, "Duration must be at least 1 month"),
  price: z.number().min(1, "Price must be greater than 0"),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function Plans() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const { plans, addPlan, updatePlan, deletePlan } = usePlanStore();
  const { editShop, shops } = useShopStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      durationMonths: 1,
      price: 0,
    },
  });

  const onSubmit = (values: PlanFormData) => {
    addPlan(values);
    reset({
      planName: "",
      durationMonths: 1,
      price: 0,
    });
    setOpen(false);
  };

  const editForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planName: "",
      durationMonths: 1,
      price: 0,
    },
  });

  const openEditDialog = (planId: number) => {
    const plan = plans.find((item) => item.id === planId);
    if (!plan) {
      return;
    }

    setEditingPlanId(planId);
    editForm.reset({
      planName: plan.planName,
      durationMonths: plan.durationMonths,
      price: plan.price,
    });
    setEditOpen(true);
  };

  const onEditSubmit = (values: PlanFormData) => {
    if (editingPlanId === null) {
      return;
    }

    updatePlan(editingPlanId, values);

    const updatedDurationLabel = `${values.durationMonths} month${values.durationMonths > 1 ? "s" : ""}`;
    shops
      .filter((shop) => shop.selectedPlanId === editingPlanId)
      .forEach((shop) => {
        editShop(shop.id, {
          selectedPlanName: `${values.durationMonths} ${values.planName}`,
          selectedPlanPrice: values.price,
          packageDuration: updatedDurationLabel,
        });
      });

    setEditingPlanId(null);
    setEditOpen(false);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">Plans</h1>
              <p className="text-sm text-muted-foreground">
                First month is free for all newly added shops. Billing starts from next month.
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="size-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Add Plan</DialogTitle>
                    <DialogDescription>
                      Add a new plan or update an existing duration price.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Input {...register("planName")} placeholder="Monthly / Premium Monthly" />
                    {errors.planName && (
                      <p className="text-sm text-red-500">{errors.planName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (Months)</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register("durationMonths", { valueAsNumber: true })}
                    />
                    {errors.durationMonths && (
                      <p className="text-sm text-red-500">{errors.durationMonths.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Price (Rs.)</Label>
                    <Input type="number" {...register("price", { valueAsNumber: true })} />
                    {errors.price && (
                      <p className="text-sm text-red-500">{errors.price.message}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="submit">Save Plan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>Edit Plan</DialogTitle>
                    <DialogDescription>
                      Update the selected plan name, duration, or price.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label>Plan Name</Label>
                    <Input {...editForm.register("planName")} />
                    {editForm.formState.errors.planName && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.planName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (Months)</Label>
                    <Input
                      type="number"
                      min={1}
                      {...editForm.register("durationMonths", { valueAsNumber: true })}
                    />
                    {editForm.formState.errors.durationMonths && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.durationMonths.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Price (Rs.)</Label>
                    <Input
                      type="number"
                      {...editForm.register("price", { valueAsNumber: true })}
                    />
                    {editForm.formState.errors.price && (
                      <p className="text-sm text-red-500">{editForm.formState.errors.price.message}</p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button type="submit">Update Plan</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length ? (
                  plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.planName}</TableCell>
                      <TableCell>{plan.durationLabel}</TableCell>
                      <TableCell>Rs. {plan.price}</TableCell>
                      <TableCell>{formatShortDate(plan.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(plan.id)}
                            aria-label="Edit plan"
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePlan(plan.id)}
                            aria-label="Delete plan"
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No plans added.
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
