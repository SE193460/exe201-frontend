import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyListings, resolveListingImageUrl, deleteMyListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import UserShell from "../layouts/UserShell";
import Pagination from "../components/Pagination";
import { useToast } from "../contexts/ToastContext";
import { LucideRocket, Trash2 } from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function statusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return { text: "Bản nháp", className: "bg-slate-100 text-slate-700" };
    case "PENDING":
      return { text: "Chờ duyệt", className: "bg-amber-100 text-amber-700" };
    case "APPROVED":
      return { text: "Đã duyệt", className: "bg-green-100 text-green-700" };
    case "REJECTED":
      return { text: "Từ chối", className: "bg-red-100 text-red-700" };
    default:
      return { text: status, className: "bg-slate-100 text-slate-700" };
  }
}

export default function MyListingsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState("Đang tải...");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const [confirmAgree, setConfirmAgree] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (e: React.MouseEvent, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setListingToDelete(listing);
    setConfirmAgree(false);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;
    // For APPROVED listings, checkbox must be checked
    if (listingToDelete.status === "APPROVED" && !confirmAgree) return;
    
    setDeleting(true);
    try {
      await deleteMyListing(listingToDelete.id);
      setListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      setShowDeleteModal(false);
      setListingToDelete(null);
      setConfirmAgree(false);
      showToast({ type: "success", message: "Xóa bài đăng thành công." });
    } catch {
      showToast({ type: "error", message: "Không thể xóa bài đăng. Vui lòng thử lại." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Bài đăng của tôi</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý các bài đăng đã tạo và trạng thái duyệt.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/my-listings/new")}
              className="rounded-full bg-[#ff6a3d] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200"
            >
              Tạo bài đăng mới
            </button>

          </div>
        </header>

        {status && (
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-500">
            {status}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {!status && !error && listings.length === 0 && (
          <div className="rounded-[24px] border border-orange-100 bg-white px-6 py-10 text-center text-sm text-slate-500">
            Bạn chưa tạo bài đăng nào. Hãy tạo bài đăng đầu tiên ngay.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((listing) => {
            const badge = statusLabel(listing.status);
            const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
            const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
            return (
              <button
                key={listing.id}
                onClick={() => navigate(`/my-listings/${listing.id}`)}
                className="rounded-[22px] border border-orange-100 bg-white px-6 py-5 text-left shadow-[0_20px_50px_-35px_rgba(255,136,0,0.4)] transition hover:-translate-y-0.5"
              >
                <div className="flex gap-4">
                  <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-orange-50">
                    {thumbnail ? (
                      <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-orange-300">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-800 line-clamp-1">{listing.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{listing.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>Giá: {listing.rentPrice.toLocaleString("vi-VN")} VND</span>
                      <span>Khu vực: {location || "Chưa cập nhật"}</span>
                      <span>Tạo: {formatDate(listing.createdAt)}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteClick(e, listing);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" /> Xóa
                      </button>
                      {listing.status === "APPROVED" && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/payment/${listing.id}`)
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                          >
                          <LucideRocket className="h-4 w-4" /> Đẩy bài
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </button>
            );
          })}
        </div>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(listings.length / PAGE_SIZE)}
          onPageChange={setPage}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteModal && listingToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="max-w-md rounded-2xl border border-orange-100 bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-800">Xóa bài đăng</h2>
              <p className="mt-3 text-sm text-slate-600">
                Bạn chắc chắn muốn xóa bài đăng <strong>{listingToDelete.title}</strong> không? Hành động này không thể hoàn tác.
              </p>
              
              {listingToDelete.status === "APPROVED" && (
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
                  }}
                  className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={(listingToDelete.status === "APPROVED" && !confirmAgree) || deleting}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Đang xóa..." : "Xóa bài đăng"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserShell>
  );
}
