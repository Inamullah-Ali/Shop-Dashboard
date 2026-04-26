import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";

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
import type { PlanRow } from "@/types/plant";

import { planSchema, type PlanFormData } from "./plan-form-schema";

type EditPlanDialogueProps = {
  plan: PlanRow;
  onUpdatePlan: (planId: number, values: PlanFormData) => void | Promise<void>;
};

export function EditPlanDialogue({ plan, onUpdatePlan }: EditPlanDialogueProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planName: plan.planName,
      durationMonths: plan.durationMonths,
      price: plan.price,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      planName: plan.planName,
      durationMonths: plan.durationMonths,
      price: plan.price,
    });
  }, [open, plan, reset]);

  const onSubmit = async (values: PlanFormData) => {
    await onUpdatePlan(plan.id, values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer" variant="outline" size="sm" aria-label="Edit plan">
          <PencilIcon className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the selected plan name, duration, or price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Plan Name</Label>
            <Input {...register("planName")} />
            {errors.planName && (
              <p className="text-sm text-red-500">{errors.planName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Duration (Months)</Label>
            <Input
              type="text"
              min={1}
              {...register("durationMonths", { valueAsNumber: true })}
            />
            {errors.durationMonths && (
              <p className="text-sm text-red-500">{errors.durationMonths.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Price (Rs.)</Label>
            <Input type="text" {...register("price", { valueAsNumber: true })} />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit">Update Plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
