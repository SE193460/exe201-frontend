import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listMyListings, resolveListingImageUrl } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import UserShell from "../layouts/UserShell";
import Pagination from "../components/Pagination";

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
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState("Đang tải...");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

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
      </div>
    </UserShell>
  );
}
