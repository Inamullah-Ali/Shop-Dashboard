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
import { formatPlanDurationLabel } from "@/lib/plan-utils";
import { AddPlanDialogue } from "@/components/Dialogue/add-plan-dialogue";
import { EditPlanDialogue } from "@/components/Dialogue/edit-plan-dialogue";
import type { PlanFormData } from "@/components/Dialogue/plan-form-schema";
import { DeletePlan } from "@/components/Dialogue/deleteplan";

export default function Plans() {
  const { plans, addPlan, updatePlan } = usePlanStore();
  const { editShop, shops } = useShopStore();

  const onAddPlan = (values: PlanFormData) => {
    addPlan(values);
  };

  const onUpdatePlan = (planId: number, values: PlanFormData) => {
    updatePlan(planId, values);

    const updatedDurationLabel = formatPlanDurationLabel(values.planName, values.durationMonths);
    shops
      .filter((shop) => shop.selectedPlanId === planId)
      .forEach((shop) => {
        editShop(shop.id, {
          selectedPlanName: `${values.durationMonths} ${values.planName}`,
          selectedPlanPrice: values.price,
          packageDuration: updatedDurationLabel,
        });
      });
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
            <AddPlanDialogue onAddPlan={onAddPlan} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHeader className="bg-muted">
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
                          <EditPlanDialogue plan={plan} onUpdatePlan={onUpdatePlan} />
                          <DeletePlan rowData={{ id: plan.id, shopName: plan.planName }} />
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
