import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { PlanRow } from "@/types/plant";
import { formatPlanDurationLabel } from "@/lib/plan-utils";



type PlanState = {
  plans: PlanRow[];
  setPlans: (plans: PlanRow[]) => void;
  addPlan: (plan: PlanRow) => void;
  updatePlan: (id: number, plan: Partial<PlanRow>) => void;
  deletePlan: (id: number) => void;
};

type PersistedPlanState = {
  plans: Array<
    PlanRow & {
      duration?: string;
    }
  >;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plans: [],

      setPlans: (plans) => set({ plans }),

      addPlan: (plan) =>
        set((state) => {
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
                      ...plan,
                    }
                  : row,
              ),
            };
          }

          return {
            plans: [...state.plans, plan],
          };
        }),

      updatePlan: (id, plan) =>
        set((state) => {
          return {
            plans: state.plans.map((row) =>
              row.id === id
                ? {
                    ...row,
                    ...plan,
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
        const state = persistedState as Partial<PersistedPlanState>;

        if (!state?.plans) {
          return { plans: [] };
        }

        if (version < 2) {
          return {
            plans: state.plans.filter((plan) => ![1, 2, 3].includes(plan.id)),
          };
        }

        if (version < 3) {
          return {
            plans: state.plans.filter((plan) => ![1, 2, 3].includes(plan.id)),
          };
        }

        return {
          ...state,
          plans: state.plans.map((plan) => {
            const fromLabel =
              typeof plan.durationLabel === "string"
                ? plan.durationLabel
                : plan.duration;
            const normalizedLabel = String(fromLabel ?? "").trim().toLowerCase();
            const parsedMonths = Number(normalizedLabel.match(/^(\d+)\s*month(s)?$/i)?.[1] ?? "");
            const parsedYears = Number(normalizedLabel.match(/^(\d+)\s*year(s)?$/i)?.[1] ?? "");
            const durationMonths = Number.isFinite(parsedMonths) && parsedMonths > 0
              ? parsedMonths
              : Number.isFinite(parsedYears) && parsedYears > 0
                ? parsedYears
                : 1;

            return {
              ...plan,
              durationMonths,
              appwriteDocumentId: plan.appwriteDocumentId,
              durationLabel:
                normalizedLabel.match(/^\d+\s*year(s)?$/i)
                  ? `${durationMonths} year${durationMonths > 1 ? "s" : ""}`
                  : formatPlanDurationLabel(plan.planName, durationMonths),
            };
          }),
        };
      },
    },
  ),
);
