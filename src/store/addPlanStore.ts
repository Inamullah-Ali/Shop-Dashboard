import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PackageDuration } from "@/types/tabledata";

export type PlanRow = {
  id: number;
  planName: string;
  durationMonths: number;
  durationLabel: PackageDuration;
  price: number;
  updatedAt: string;
};

type PlanState = {
  plans: PlanRow[];
  setPlans: (plans: PlanRow[]) => void;
  addPlan: (plan: { planName: string; durationMonths: number; price: number }) => void;
  updatePlan: (id: number, plan: { planName: string; durationMonths: number; price: number }) => void;
  deletePlan: (id: number) => void;
};

export function getPriceFromPlans(
  plans: PlanRow[],
  duration: PackageDuration | undefined,
) {
  const effectiveDuration = duration ?? "1 month";
  const matched = plans.find((plan) => plan.durationLabel === effectiveDuration);
  return matched?.price ?? 0;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plans: [],

      setPlans: (plans) => set({ plans }),

      addPlan: (plan) =>
        set((state) => {
          const now = new Date().toISOString();
          const durationLabel = `${plan.durationMonths} month${plan.durationMonths > 1 ? "s" : ""}`;
          const existing = state.plans.find(
            (row) =>
              row.planName.toLowerCase() === plan.planName.toLowerCase() &&
              row.durationMonths === plan.durationMonths,
          );

          if (existing) {
            return {
              plans: state.plans.map((row) =>
                row.id === existing.id
                  ? {
                      ...row,
                      planName: plan.planName,
                      durationMonths: plan.durationMonths,
                      durationLabel,
                      price: plan.price,
                      updatedAt: now,
                    }
                  : row,
              ),
            };
          }

          return {
            plans: [
              ...state.plans,
              {
                id: Date.now(),
                planName: plan.planName,
                durationMonths: plan.durationMonths,
                durationLabel,
                price: plan.price,
                updatedAt: now,
              },
            ],
          };
        }),

      updatePlan: (id, plan) =>
        set((state) => {
          const now = new Date().toISOString();
          const durationLabel = `${plan.durationMonths} month${plan.durationMonths > 1 ? "s" : ""}`;

          return {
            plans: state.plans.map((row) =>
              row.id === id
                ? {
                    ...row,
                    planName: plan.planName,
                    durationMonths: plan.durationMonths,
                    durationLabel,
                    price: plan.price,
                    updatedAt: now,
                  }
                : row,
            ),
          };
        }),

      deletePlan: (id) =>
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== id),
        })),
    }),
    {
      name: "add-plan-store",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) => {
        const state = persistedState as {
          plans?: Array<
            PlanRow & {
              duration?: string;
            }
          >;
        };

        if (!state?.plans) {
          return { plans: [] } as PlanState;
        }

        if (version < 2) {
          return {
            plans: state.plans.filter((plan) => ![1, 2, 3].includes(plan.id)),
          } as PlanState;
        }

        if (version < 3) {
          return {
            plans: state.plans.filter((plan) => ![1, 2, 3].includes(plan.id)),
          } as PlanState;
        }

        return {
          ...state,
          plans: state.plans.map((plan) => {
            const fromLabel =
              typeof plan.durationLabel === "string"
                ? plan.durationLabel
                : plan.duration;
            const parsedMonths = Number(String(fromLabel ?? "").match(/^(\d+)\s*month(s)?$/i)?.[1] ?? "1");
            const durationMonths = Number.isFinite(parsedMonths) && parsedMonths > 0 ? parsedMonths : 1;

            return {
              ...plan,
              durationMonths,
              durationLabel: `${durationMonths} month${durationMonths > 1 ? "s" : ""}`,
            };
          }),
        } as PlanState;
      },
    },
  ),
);
