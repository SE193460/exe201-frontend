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

  function statusBadge(s: string) {
    switch (s) {
      case "APPROVED":
        return { text: "Đang hoạt động", cls: "status-active" };
      case "PENDING":
        return { text: "Chờ duyệt", cls: "status-pending" };
      case "DRAFT":
        return { text: "Bản nháp", cls: "status-expired" };
      case "REJECTED":
        return { text: "Từ chối", cls: "status-rejected" };
      default:
        return { text: s, cls: "status-expired" };
    }
  }

  function formatPrice(price: number) {
    if (price >= 1000000) {
      const tr = price / 1000000;
      return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)}Tr`;
    }
    return price.toLocaleString("vi-VN");
  }

  function renderFeaturedCard(listing: Listing) {
    const badge = statusBadge(listing.status);
    const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
    const location = listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");

    return (
      <div
        key={listing.id}
        className="post-card group overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white cursor-pointer"
        onClick={() => navigate(`/my-listings/${listing.id}`)}
      >
        <div className="flex flex-col md:flex-row">
          <div className="relative h-56 md:h-auto md:w-[320px] flex-shrink-0 overflow-hidden bg-[var(--surface)]">
            {thumbnail ? (
              <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-12 w-12" />
              </div>
            )}
            <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${badge.cls} shadow-sm`}>
              {badge.text}
            </span>
            {listing.images && listing.images.length > 0 && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" /> {listing.images.length}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-[var(--on-surface)] line-clamp-1 leading-snug" style={{ fontFamily: "var(--font-main)" }}>
                  {listing.title}
                </h3>
                <span className="flex-shrink-0 text-lg font-extrabold text-[var(--primary)]">
                  {formatPrice(listing.rentPrice)}<span className="text-sm font-medium text-slate-400">/tháng</span>
                </span>
              </div>
              {location && (
                <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500">
                  <svg className="h-3.5 w-3.5 flex-shrink-0 text-[var(--primary)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {location}
                </p>
              )}

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {listing.amenities.slice(0, 3).map((a) => (
                    <span key={a.id} className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/5 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]">
                      {a.name}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 line-clamp-2 text-sm text-slate-500 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                Cập nhật {timeAgo(listing.updatedAt)}
              </div>
              <div className="flex items-center gap-1">
                {listing.status === "APPROVED" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/payment/${listing.id}`); }}
                    className="rounded-lg p-2.5 text-slate-400 transition hover:bg-[var(--primary-container)] hover:text-[var(--primary)]"
                    title="Đẩy bài"
                  >
                    <LucideRocket className="h-4.5 w-4.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/my-listings/${listing.id}/edit`); }}
                  className="rounded-lg p-2.5 text-slate-400 transition hover:bg-[var(--primary-container)] hover:text-[var(--primary)]"
                  title="Chỉnh sửa"
                >
                  <Pencil className="h-4.5 w-4.5" />
                </button>
                {listing.status === "APPROVED" ? (
                  <button
                    onClick={(e) => handleRetractClick(e, listing)}
                    className="rounded-lg p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Gỡ bài"
                  >
                    <XCircle className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleDeleteClick(e, listing)}
                    className="rounded-lg p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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

  function renderStandardCard(listing: Listing) {
    const badge = statusBadge(listing.status);
    const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");

    return (
      <div
        key={listing.id}
        className="post-card group overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white cursor-pointer"
        onClick={() => navigate(`/my-listings/${listing.id}`)}
      >
        <div className="relative h-44 overflow-hidden bg-[var(--surface)]">
          {thumbnail ? (
            <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-xs font-semibold ${badge.cls} shadow-sm`}>
            {badge.text}
          </span>
          {listing.images && listing.images.length > 1 && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3 w-3" /> {listing.images.length}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-base font-bold text-[var(--on-surface)] line-clamp-1" style={{ fontFamily: "var(--font-main)" }}>
            {listing.title}
          </h3>
          <p className="mt-1 text-base font-extrabold text-[var(--primary)]">
            {formatPrice(listing.rentPrice)}<span className="text-sm font-medium text-slate-400">/tháng</span>
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-500 leading-relaxed">
            {listing.description}
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(listing.updatedAt)}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/listings/${listing.id}`); }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[var(--primary-container)] hover:text-[var(--primary)]"
                title="Xem"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/my-listings/${listing.id}/edit`); }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-[var(--primary-container)] hover:text-[var(--primary)]"
                title="Chỉnh sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {listing.status === "APPROVED" ? (
                <button
                  onClick={(e) => handleRetractClick(e, listing)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Gỡ bài"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => handleDeleteClick(e, listing)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
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

  function renderListingGrid() {
    const items = paginatedListings;
    if (items.length === 0) return null;

    const featured = items.filter((_, i) => i % 3 === 0);
    const standard = items.filter((_, i) => i % 3 !== 0);
    const result: React.ReactNode[] = [];

    featured.forEach((item) => {
      result.push(
        <div key={`row-f-${item.id}`} className="grid gap-5">
          {renderFeaturedCard(item)}
        </div>
      );
    });

    for (let i = 0; i < standard.length; i += 2) {
      if (i + 1 < standard.length) {
        result.push(
          <div key={`row-s-${i}`} className="grid gap-5 md:grid-cols-2">
            {renderStandardCard(standard[i])}
            {renderStandardCard(standard[i + 1])}
          </div>
        );
      } else {
        result.push(
          <div key={`row-s-${i}`} className="grid gap-5">
            {renderStandardCard(standard[i])}
          </div>
        );
      }
    }

    return <div className="space-y-5">{result}</div>;
  }

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 md:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
              Bài đăng của tôi
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Quản lý và theo dõi hiệu quả các tin đăng tìm phòng/người ở ghép của bạn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-[var(--primary-container)] flex items-center justify-center text-[var(--primary)] text-lg font-bold">📄</div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Số bài đăng</p>
                <p className="text-lg font-extrabold text-[var(--primary)]">{String(listings.length).padStart(2, "0")}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="border-b border-slate-200">
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`relative px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "text-[var(--primary)]"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--primary)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {status && (
          <div className="flex h-40 items-center justify-center rounded-[var(--radius-md)] border border-slate-200 bg-white">
            <div className="text-center">
              <span className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent" />
              <p className="mt-2 text-sm text-slate-400">{status}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-white px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {!status && !error && filteredListings.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)]">
              <ImageIcon className="h-7 w-7 text-slate-300" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-600">Chưa có bài đăng nào</p>
            <p className="mt-1 text-sm text-slate-400">Tạo bài đăng đầu tiên để bắt đầu quản lý.</p>
            <button
              onClick={() => navigate("/my-listings/new")}
              className="mt-5 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-90"
            >
              + Tạo bài đăng
            </button>
          </div>
        )}

        {!status && !error && filteredListings.length > 0 && renderListingGrid()}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(filteredListings.length / PAGE_SIZE)}
          onPageChange={setPage}
        />

        {showDeleteModal && listingToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="max-w-md rounded-[var(--radius-md)] border border-slate-200 bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
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
                  className="flex-1 rounded-[var(--radius-md)] border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={(actionType === "retract" && !confirmAgree) || deleting}
                  className="flex-1 rounded-[var(--radius-md)] bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
