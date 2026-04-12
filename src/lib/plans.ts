import type { PackageDuration } from "@/types/tabledata";

export const PLAN_PRICES: Record<PackageDuration, number> = {
  "1 month": 1200,
  "6 months": 6500,
  "1 year": 12000,
};

export const PLAN_ROWS: Array<{ duration: PackageDuration; price: number }> = [
  { duration: "1 month", price: PLAN_PRICES["1 month"] },
  { duration: "6 months", price: PLAN_PRICES["6 months"] },
  { duration: "1 year", price: PLAN_PRICES["1 year"] },
];

export function getPlanPrice(duration?: PackageDuration) {
  return PLAN_PRICES[duration ?? "1 month"];
}
