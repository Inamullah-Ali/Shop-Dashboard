import type { PackageDuration } from "@/types/tabledata";
import type { PlanRow } from "@/types/plant";

export function formatPlanDurationLabel(planName: string, durationValue: number) {
  const safeValue = Number.isFinite(durationValue) && durationValue > 0 ? Math.trunc(durationValue) : 1;
  const isYearPlan = /year/i.test(planName);
  const unit = isYearPlan ? "year" : "month";
  return `${safeValue} ${unit}${safeValue > 1 ? "s" : ""}`;
}

export function getPriceFromPlans(
  plans: PlanRow[],
  duration: PackageDuration | undefined,
) {
  const effectiveDuration = duration ?? "1 month";
  const matched = plans.find((plan) => plan.durationLabel === effectiveDuration);
  return matched?.price ?? 0;
}
