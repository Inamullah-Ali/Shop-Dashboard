import type { IShop } from "@/types/tabledata";

const DAY_MS = 1000 * 60 * 60 * 24;

export function getShopCreatedDate(shop: Pick<IShop, "id" | "createdAt">) {
  const parsed = new Date(shop.createdAt ?? shop.id);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(shop.id);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function getFreeMonthEndDate(shop: Pick<IShop, "id" | "createdAt">) {
  return addDays(getShopCreatedDate(shop), 30);
}

export function getBillingStartDate(shop: Pick<IShop, "id" | "createdAt">) {
  return getFreeMonthEndDate(shop);
}

export function formatShortDate(value: Date | string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
