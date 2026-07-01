import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPinned, Search, SlidersHorizontal } from "lucide-react";
import { fetchSavedListings, resolveListingImageUrl, toggleSaveListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import UserShell from "../layouts/UserShell";
import Pagination from "../components/Pagination";

function getBadge(listing: Listing) {
  if (listing.roomType === "SINGLE") return { text: "Phòng đơn", color: "bg-amber-600" };
  if (listing.preferredGender === "FEMALE") return { text: "Nữ ở ghép", color: "bg-amber-600" };
  if (listing.preferredGender === "MALE") return { text: "Nam ở ghép", color: "bg-amber-600" };
  if (listing.preferredGender === "ANY") return { text: "Nam/Nữ", color: "bg-amber-600" };
  if (listing.maxOccupants && listing.maxOccupants <= 1) return { text: "Cần tìm bạn", color: "bg-amber-600" };
  return { text: "Tìm người ở ghép", color: "bg-amber-600" };
}

function formatPrice(price: number) {
  if (price >= 1000000) {
    const tr = price / 1000000;
    return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)}Tr`;
  }
  return price.toLocaleString("vi-VN");
}

export default function SavedListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    fetchSavedListings()
      .then((data) => setListings(data))
      .catch(() => setError("Không thể tải danh sách tin đã lưu. Vui lòng đăng nhập."))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const pagedListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUnsave = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    try {
      await toggleSaveListing(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch {
      // ignore
    }
  };

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 md:px-6">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] md:text-3xl" style={{ fontFamily: "var(--font-main)" }}>
              Tin đã lưu
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Bạn đang quan tâm đến {listings.length} phòng ở ghép chất lượng.
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <SlidersHorizontal className="h-4 w-4" />
            Lọc kết quả
          </button>
        </header>

        {/* Loading */}
        {loading && (
          <div className="flex h-60 items-center justify-center rounded-[var(--radius-md)] border border-slate-200 bg-white">
            <span className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-white px-6 py-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && listings.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-container)]">
              <Search className="h-7 w-7 text-[var(--primary)]" />
            </div>
            <p className="mt-4 text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
              Chưa có tin đã lưu
            </p>
            <p className="mt-1 text-sm text-slate-500">Khám phá và lưu những phòng phù hợp với bạn.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-5 rounded-full bg-[#8B5E34] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Khám phá ngay
            </button>
          </div>
        )}

        {/* Listing grid */}
        {!loading && !error && listings.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pagedListings.map((listing) => {
                const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
                const location = listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
                const badge = getBadge(listing);

                return (
                  <div
                    key={listing.id}
                    className="group overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">Chưa có ảnh</div>
                      )}
                      {/* Heart icon */}
                      <button
                        onClick={(e) => handleUnsave(e, listing.id)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--primary)] shadow-sm backdrop-blur-sm transition hover:bg-white hover:scale-110"
                      >
                        <Heart className="h-4 w-4 fill-[var(--primary)]" />
                      </button>
                      {/* Badge */}
                      <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold text-white ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-base font-bold text-[var(--on-surface)] line-clamp-1" style={{ fontFamily: "var(--font-main)" }}>
                        {listing.title}
                      </h3>
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPinned className="h-3 w-3 flex-shrink-0 text-[var(--primary)]" />
                        {location || "Chưa cập nhật"}
                      </p>

                      {/* Amenity tags */}
                      {listing.amenities && listing.amenities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {listing.amenities.slice(0, 3).map((a) => (
                            <span key={a.id} className="rounded-full border border-slate-200 bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price + link */}
                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                        <p className="text-base font-extrabold text-[var(--primary)]">
                          {formatPrice(listing.rentPrice)}<span className="text-xs font-medium text-slate-400">đ/tháng</span>
                        </p>
                        <span className="text-xs font-semibold text-[var(--primary)] transition group-hover:underline">
                          Chi tiết
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* "Find more" CTA card */}
              <div
                className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-slate-300 bg-white p-8 text-center cursor-pointer transition hover:border-[var(--primary)]/40 hover:bg-orange-50/20"
                onClick={() => navigate("/")}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary-container)]">
                  <Search className="h-7 w-7 text-[var(--primary)]" />
                </div>
                <p className="mt-4 text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
                  Tìm thêm phòng mới?
                </p>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                  Khám phá hàng ngàn tin đăng<br />mới mỗi ngày phù hợp với tiêu<br />chí của bạn.
                </p>
                <button className="mt-5 rounded-full bg-[#8B5E34] px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
                  Khám phá ngay
                </button>
              </div>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </UserShell>
  );
}
