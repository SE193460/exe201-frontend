import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { formatListingDate, formatRelativeTime, isListingOld } from "../utils/listingTime";

type PostedTimeTagProps = {
  /** ISO date the listing went live (fallback: createdAt). */
  postedAt?: string | null;
  /**
   * `overlay` renders a pill suitable for sitting on top of an image,
   * `inline` renders plain text for use inside a card body.
   */
  variant?: "overlay" | "inline";
  className?: string;
};

/**
 * Shows exactly when a listing was posted *and* how long ago that was, e.g.
 * "16/10/2026 · 2 giờ trước". Listings older than 30 days get an "Đã cũ" badge.
 */
export default function PostedTimeTag({ postedAt, variant = "overlay", className = "" }: PostedTimeTagProps) {
  const { t } = useTranslation();

  const absolute = formatListingDate(postedAt);
  const relative = formatRelativeTime(postedAt, t);
  if (!absolute && !relative) return null;

  const old = isListingOld(postedAt);
  const label = absolute && relative ? `${absolute} · ${relative}` : absolute || relative;

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] text-slate-500 ${className}`}>
        <Clock className="h-3 w-3 shrink-0" />
        <span>{label}</span>
        {old && (
          <span className="ml-0.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {t("Đã cũ")}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
        old ? "bg-slate-800/85 text-white" : "bg-white/90 text-slate-700"
      } ${className}`}
    >
      <Clock className="h-3 w-3 shrink-0" />
      {old ? `${t("Đã cũ")} · ${label}` : label}
    </span>
  );
}
