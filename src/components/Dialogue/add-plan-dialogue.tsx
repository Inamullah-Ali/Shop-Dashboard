import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";

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

import { planSchema, type PlanFormData } from "./plan-form-schema";

type AddPlanDialogueProps = {
  onAddPlan: (values: PlanFormData) => void;
};

export function AddPlanDialogue({ onAddPlan }: AddPlanDialogueProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planName: "",
      durationMonths: 1,
      price: 0,
    },
  });

  const onSubmit = (values: PlanFormData) => {
    onAddPlan(values);
    reset({
      planName: "",
      durationMonths: 1,
      price: 0,
    });
    setOpen(false);
  };

  return (
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
            <Button type="submit">Save Plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
