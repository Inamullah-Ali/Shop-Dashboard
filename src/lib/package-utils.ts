import type { IShop, PackageDuration } from "@/types/tabledata"

export const PACKAGE_DURATION_OPTIONS: PackageDuration[] = [
  "1 month",
  "6 months",
  "1 year",
]

export function normalizePackageDuration(
  value?: string | null,
): PackageDuration {
  if (!value) {
    return "1 month"
  }

  const trimmed = value.trim().toLowerCase()
  if (!trimmed) {
    return "1 month"
  }

  const monthMatch = trimmed.match(/^(\d+)\s*month(s)?$/)
  if (monthMatch) {
    const months = Number(monthMatch[1])
    if (Number.isFinite(months) && months > 0) {
      return `${months} month${months > 1 ? "s" : ""}`
    }
  }

  const yearMatch = trimmed.match(/^(\d+)\s*year(s)?$/)
  if (yearMatch) {
    const years = Number(yearMatch[1])
    if (Number.isFinite(years) && years > 0) {
      return `${years} year${years > 1 ? "s" : ""}`
    }
  }

  return "1 month"
}

function parseShopStartDate(shop: Pick<IShop, "id" | "createdAt">) {
  const fallback = new Date(shop.id)

  if (!shop.createdAt) {
    return fallback
  }

  const direct = new Date(shop.createdAt)
  if (!Number.isNaN(direct.getTime())) {
    return direct
  }

  // Supports local-storage strings like "08/04/2026" or "08-04-2026" (DD/MM/YYYY).
  const match = shop.createdAt.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match) {
    const day = Number(match[1])
    const month = Number(match[2]) - 1
    const year = Number(match[3])
    const parsed = new Date(year, month, day)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return fallback
}

const DAY_MS = 1000 * 60 * 60 * 24

const FREE_TRIAL_DAYS = 30

function getDurationDays(duration: PackageDuration) {
  const normalized = normalizePackageDuration(duration)

  const monthMatch = normalized.match(/^(\d+)\s*month(s)?$/)
  if (monthMatch) {
    return Number(monthMatch[1]) * 30
  }

  const yearMatch = normalized.match(/^(\d+)\s*year(s)?$/)
  if (yearMatch) {
    return Number(yearMatch[1]) * 365
  }

  return 30
}

export function getPackageExpiryDate(
  shop: Pick<IShop, "id" | "createdAt" | "packageDuration">,
) {
  const startDate = parseShopStartDate(shop)
  const duration = normalizePackageDuration(shop.packageDuration)
  const durationDays = getDurationDays(duration)

  return new Date(startDate.getTime() + durationDays * DAY_MS)
}

export function getFreeTrialDaysRemaining(
  shop: Pick<IShop, "id" | "createdAt">,
  referenceDate = new Date(),
) {
  const startDate = parseShopStartDate(shop)
  const freeTrialEnd = new Date(startDate.getTime() + FREE_TRIAL_DAYS * DAY_MS)

  if (referenceDate.getTime() >= freeTrialEnd.getTime()) {
    return 0
  }

  const todayStart = new Date(referenceDate)
  todayStart.setHours(0, 0, 0, 0)

  const trialEndStart = new Date(freeTrialEnd)
  trialEndStart.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((trialEndStart.getTime() - todayStart.getTime()) / DAY_MS)
  return diffDays + 1
}

export function isFreeTrialActive(
  shop: Pick<IShop, "id" | "createdAt">,
  referenceDate = new Date(),
) {
  return getFreeTrialDaysRemaining(shop, referenceDate) > 0
}

export function getPackageDaysRemaining(
  shop: Pick<IShop, "id" | "createdAt" | "packageDuration">,
  referenceDate = new Date(),
) {
  const expiryDate = getPackageExpiryDate(shop)
  if (referenceDate.getTime() >= expiryDate.getTime()) {
    return 0
  }

  const todayStart = new Date(referenceDate)
  todayStart.setHours(0, 0, 0, 0)

  const expiryStart = new Date(expiryDate)
  expiryStart.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((expiryStart.getTime() - todayStart.getTime()) / DAY_MS)

  // Includes the current day in the remaining count before expiry.
  return diffDays + 1
}

export function getDerivedShopStatus(
  shop: Pick<IShop, "id" | "createdAt" | "status">,
  referenceDate = new Date(),
) {
  if (isFreeTrialActive(shop, referenceDate)) {
    return "Active (Free)"
  }

  return shop.status === "Active" ? "Active" : "Inactive"
}

export function isShopActiveStatus(
  shop: Pick<IShop, "id" | "createdAt" | "status">,
  referenceDate = new Date(),
) {
  const status = getDerivedShopStatus(shop, referenceDate)
  return status === "Active" || status === "Active (Free)"
}

export function shouldShowPackageAlert(
  shop: Pick<IShop, "id" | "createdAt">,
  referenceDate = new Date(),
) {
  const trialDaysRemaining = getFreeTrialDaysRemaining(shop, referenceDate)
  return trialDaysRemaining <= 10 && trialDaysRemaining > 0
}
