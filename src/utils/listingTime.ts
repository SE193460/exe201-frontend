// Helpers for showing how long ago a listing was posted and flagging stale
// listings. A listing is considered "old" once it is 30 days (≈1 month) old.

export const OLD_LISTING_DAYS = 30;

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getListingDate(input?: string | null): Date | null {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function listingAgeDays(input?: string | null, now: Date = new Date()): number | null {
  const date = getListingDate(input);
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

/** True when the listing was posted 30+ days ago (older than ~1 month). */
export function isListingOld(input?: string | null, now: Date = new Date()): boolean {
  const days = listingAgeDays(input, now);
  return days !== null && days >= OLD_LISTING_DAYS;
}

/** Exact posted date as dd/mm/yyyy, e.g. "16/10/2026". Empty string when invalid. */
export function formatListingDate(
  input: string | null | undefined,
  locale = "vi-VN",
): string {
  const date = getListingDate(input);
  if (!date) return "";
  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Human friendly Vietnamese relative time, e.g. "3 ngày trước". */
export function formatRelativeTime(
  input: string | null | undefined,
  t: TranslateFn,
  now: Date = new Date(),
): string {
  const date = getListingDate(input);
  if (!date) return "";
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return t("Vừa xong");

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t("Vừa xong");
  if (minutes < 60) return t("{{count}} phút trước", { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("{{count}} giờ trước", { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 7) return t("{{count}} ngày trước", { count: days });
  if (days < 30) return t("{{count}} tuần trước", { count: Math.floor(days / 7) });

  const months = Math.floor(days / 30);
  if (months < 12) return t("{{count}} tháng trước", { count: months });
  return t("{{count}} năm trước", { count: Math.floor(months / 12) });
}
