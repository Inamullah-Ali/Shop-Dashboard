import type { PackageDuration } from "./tabledata";

export type PlanRow = {
  id: number;
  appwriteDocumentId?: string;
  planName: string;
  durationMonths: number;
  durationLabel: PackageDuration;
  price: number;
  updatedAt: string;
};