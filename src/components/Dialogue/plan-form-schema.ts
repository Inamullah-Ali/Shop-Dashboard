import { z } from "zod";

export const planSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  durationMonths: z.number().int().min(1, "Duration must be at least 1 month"),
  price: z.number().min(1, "Price must be greater than 0"),
});

export type PlanFormData = z.infer<typeof planSchema>;
