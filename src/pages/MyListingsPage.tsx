import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyListings, resolveListingImageUrl, deleteMyListing, unpublishMyListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import UserShell from "../layouts/UserShell";
import Pagination from "../components/Pagination";
import { useToast } from "../contexts/ToastContext";
import { LucideRocket, Trash2, XCircle, Eye, Pencil, ImageIcon, Clock } from "lucide-react";

function timeAgo(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Vừa xong";
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

type FilterTab = "all" | "active" | "hidden" | "expired";

export default function MyListingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState("Đang tải...");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const PAGE_SIZE = 4;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [confirmAgree, setConfirmAgree] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "retract" | null>(null);

  useEffect(() => {
    listMyListings()
      .then((data) => {
        setListings(data);
        setStatus("");
      })
      .catch(() => {
        setError("Không thể tải bài đăng. Vui lòng đăng nhập lại.");
        setStatus("");
      });
  }, []);

  const filteredListings = useMemo(() => {
    switch (activeTab) {
      case "active":
        return listings.filter((l) => l.status === "APPROVED");
      case "hidden":
        return listings.filter((l) => l.status === "DRAFT" || l.status === "REJECTED");
      case "expired":
        return listings.filter((l) => l.status === "EXPIRED");
      default:
        return listings;
    }
  }, [listings, activeTab]);

  const counts = useMemo(() => ({
    all: listings.length,
    active: listings.filter((l) => l.status === "APPROVED").length,
    hidden: listings.filter((l) => l.status === "DRAFT" || l.status === "REJECTED").length,
    expired: listings.filter((l) => l.status === "EXPIRED").length,
  }), [listings]);

  const handleDeleteClick = (e: React.MouseEvent, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setListingToDelete(listing);
    setConfirmAgree(false);
    setActionType("delete");
    setShowDeleteModal(true);
  };

  const handleRetractClick = (e: React.MouseEvent, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setListingToDelete(listing);
    setConfirmAgree(false);
    setActionType("retract");
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;
    if (actionType === "retract" && !confirmAgree) return;

    setDeleting(true);
    try {
      if (actionType === "delete") {
        await deleteMyListing(listingToDelete.id);
        setListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      } else if (actionType === "retract") {
        await unpublishMyListing(listingToDelete.id);
        const updatedListings = await listMyListings();
        setListings(updatedListings);
      }
      setShowDeleteModal(false);
      setListingToDelete(null);
      setConfirmAgree(false);
      setActionType(null);
      const successMsg = actionType === "retract" ? "Gỡ bài đăng thành công." : "Xóa bài đăng thành công.";
      showToast({ type: "success", message: successMsg });
    } catch {
      const errorMsg = actionType === "retract" ? "Không thể gỡ bài đăng. Vui lòng thử lại." : "Không thể xóa bài đăng. Vui lòng thử lại.";
      showToast({ type: "error", message: errorMsg });
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: `Tất cả (${counts.all})` },
    { key: "active", label: `Đang hoạt động (${counts.active})` },
    { key: "hidden", label: `Đã ẩn (${counts.hidden})` },
    { key: "expired", label: `Hết hạn (${counts.expired})` },
  ];

  const paginatedListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Helper for badge rendering */
  function statusBadge(s: string) {
    switch (s) {
      case "APPROVED":
        return { text: "Đang hoạt động", bg: "bg-green-500", textColor: "text-white" };
      case "PENDING":
        return { text: "Chờ duyệt", bg: "bg-amber-500", textColor: "text-white" };
      case "DRAFT":
        return { text: "Bản nháp", bg: "bg-slate-500", textColor: "text-white" };
      case "REJECTED":
        return { text: "Từ chối", bg: "bg-red-500", textColor: "text-white" };
      default:
        return { text: s, bg: "bg-slate-500", textColor: "text-white" };
    }
  }

  /* Format price as Vietnamese format */
  function formatPrice(price: number) {
    if (price >= 1000000) {
      const tr = price / 1000000;
      return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)}Tr`;
    }
    return price.toLocaleString("vi-VN");
  }

  /* === CARD RENDERERS === */

  /* Featured card: large image left, details right */
  function renderFeaturedCard(listing: Listing) {
    const badge = statusBadge(listing.status);
    const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
    const location = listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");

    return (
      <div
        key={listing.id}
        className="group col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg cursor-pointer"
        onClick={() => navigate(`/my-listings/${listing.id}`)}
      >
        <div className="flex flex-col md:flex-row">
          {/* Image section */}
          <div className="relative h-56 md:h-auto md:w-[320px] flex-shrink-0 overflow-hidden bg-slate-100">
            {thumbnail ? (
              <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
            {/* Status badge */}
            <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.textColor} shadow-sm`}>
              {badge.text}
            </span>
            {/* Image count */}
            {listing.images && listing.images.length > 0 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" /> {listing.images.length}
              </span>
            )}
          </div>

          {/* Info section */}
          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-800 line-clamp-1 leading-snug">
                  {listing.title}
                </h3>
                <span className="flex-shrink-0 text-lg font-extrabold text-[#c17a2f]">
                  {formatPrice(listing.rentPrice)}<span className="text-sm font-medium text-slate-400">/tháng</span>
                </span>
              </div>
              {location && (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-[#c17a2f]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {location}
                </p>
              )}

              {/* Amenity tags */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {listing.amenities.slice(0, 3).map((a) => (
                    <span key={a.id} className="rounded-full border border-[#c17a2f]/20 bg-[#c17a2f]/5 px-2.5 py-0.5 text-xs font-medium text-[#c17a2f]">
                      {a.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Description preview */}
              <p className="mt-3 line-clamp-2 text-sm text-slate-500 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Bottom row: stats + actions */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Cập nhật {timeAgo(listing.updatedAt)}
              </div>
              <div className="flex items-center gap-1">
                {listing.status === "APPROVED" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/payment/${listing.id}`); }}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-[#c17a2f]"
                    title="Đẩy bài"
                  >
                    <LucideRocket className="h-4.5 w-4.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/my-listings/${listing.id}/edit`); }}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-[#c17a2f]"
                  title="Chỉnh sửa"
                >
                  <Pencil className="h-4.5 w-4.5" />
                </button>
                {listing.status === "APPROVED" ? (
                  <button
                    onClick={(e) => handleRetractClick(e, listing)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Gỡ bài"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleDeleteClick(e, listing)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Xóa"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Standard card: image on top, info below */
  function renderStandardCard(listing: Listing) {
    const badge = statusBadge(listing.status);
    const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");

    return (
      <div
        key={listing.id}
        className="group col-span-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg cursor-pointer"
        onClick={() => navigate(`/my-listings/${listing.id}`)}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-slate-100">
          {thumbnail ? (
            <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${badge.bg} ${badge.textColor} shadow-sm`}>
            {badge.text}
          </span>
          {listing.images && listing.images.length > 1 && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" /> {listing.images.length}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-base font-bold text-slate-800 line-clamp-1">
            {listing.title}
          </h3>
          <p className="mt-1 text-base font-extrabold text-[#c17a2f]">
            {formatPrice(listing.rentPrice)}<span className="text-sm font-medium text-slate-400">/tháng</span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-500 leading-relaxed">
            {listing.description}
          </p>

          {/* Bottom row */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(listing.updatedAt)}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/listings/${listing.id}`); }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-orange-50 hover:text-[#c17a2f]"
                title="Xem"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/my-listings/${listing.id}/edit`); }}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-orange-50 hover:text-[#c17a2f]"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {listing.status === "APPROVED" ? (
                <button
                  onClick={(e) => handleRetractClick(e, listing)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Gỡ bài"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => handleDeleteClick(e, listing)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Render listing grid with alternating layout */
  function renderListingGrid() {
    const items = paginatedListings;
    if (items.length === 0) return null;

    const result: React.ReactNode[] = [];
    let i = 0;
    let row = 0;

    while (i < items.length) {
      if (row % 2 === 0) {
        // Row type A: 1 featured (col-span-2) + 1 standard (if available)
        if (i + 1 < items.length) {
          result.push(
            <div key={`row-${row}`} className="grid gap-5 md:grid-cols-[1.6fr_1fr]">
              {renderFeaturedCard(items[i])}
              {renderStandardCard(items[i + 1])}
            </div>
          );
          i += 2;
        } else {
          result.push(
            <div key={`row-${row}`} className="grid gap-5">
              {renderFeaturedCard(items[i])}
            </div>
          );
          i += 1;
        }
      } else {
        // Row type B: 1 standard + 1 featured
        if (i + 1 < items.length) {
          result.push(
            <div key={`row-${row}`} className="grid gap-5 md:grid-cols-[1fr_1.6fr]">
              {renderStandardCard(items[i])}
              {renderFeaturedCard(items[i + 1])}
            </div>
          );
          i += 2;
        } else {
          result.push(
            <div key={`row-${row}`} className="grid gap-5">
              {renderStandardCard(items[i])}
            </div>
          );
          i += 1;
        }
      }
      row++;
    }

    return <div className="space-y-5">{result}</div>;
  }

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 md:px-6">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold italic text-slate-800" style={{ fontFamily: "'Georgia', serif" }}>
              Bài đăng của tôi
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Quản lý và theo dõi hiệu quả các tin đăng tìm phòng/người ở ghép của bạn.
            </p>
          </div>
          <div className="flex items-center gap-3">
              {/* Stat cards styled like sample */}
              <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 text-lg font-bold">👁️</div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tổng lượt xem</p>
                  <p className="text-lg font-extrabold text-[#c17a2f]">—</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 text-lg font-bold">📄</div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Số bài đăng</p>
                  <p className="text-lg font-extrabold text-[#c17a2f]">{String(listings.length).padStart(2, "0")}</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/my-listings/new")}
                className="rounded-full bg-[#c17a2f] px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-200/50 transition hover:bg-[#a5681f] active:scale-[0.98]"
              >
                Post a Room
              </button>
            </div>
        </header>

        {/* Filter Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`relative px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "text-[#c17a2f]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#c17a2f]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Loading / Error / Empty */}
        {status && (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="text-center">
              <span className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-[#c17a2f] border-t-transparent" />
              <p className="mt-2 text-sm text-slate-400">{status}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {!status && !error && filteredListings.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
              <ImageIcon className="h-7 w-7 text-slate-300" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">Chưa có bài đăng nào</p>
            <p className="mt-1 text-sm text-slate-400">Tạo bài đăng đầu tiên để bắt đầu quản lý.</p>
            <button
              onClick={() => navigate("/my-listings/new")}
              className="mt-5 rounded-xl bg-[#c17a2f] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200/50 transition hover:bg-[#a5681f]"
            >
              + Tạo bài đăng
            </button>
          </div>
        )}

        {/* Listing Grid */}
        {!status && !error && filteredListings.length > 0 && renderListingGrid()}

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filteredListings.length / PAGE_SIZE)}
          onPageChange={setPage}
        />

        {/* Delete/Retract Confirmation Modal */}
        {showDeleteModal && listingToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-slate-800">
                {actionType === "retract" ? "Gỡ bài đăng" : "Xóa bài đăng"}
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Bạn chắc chắn muốn {actionType === "retract" ? "gỡ" : "xóa"} bài đăng <strong>{listingToDelete.title}</strong> không?
                {actionType === "retract" ? " Bài đăng sẽ chuyển về trạng thái Bản nháp." : " Hành động này không thể hoàn tác."}
              </p>

              {actionType === "retract" && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={confirmAgree}
                      onChange={(e) => setConfirmAgree(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600"
                    />
                    <span className="text-sm text-slate-700">
                      Tôi đã tìm được người ở ghép hoặc không có nhu cầu đăng bài nữa
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setListingToDelete(null);
                    setConfirmAgree(false);
                    setActionType(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={(actionType === "retract" && !confirmAgree) || deleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (actionType === "retract" ? "Đang gỡ..." : "Đang xóa...") : (actionType === "retract" ? "Gỡ bài đăng" : "Xóa bài đăng")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserShell>
  );
}
