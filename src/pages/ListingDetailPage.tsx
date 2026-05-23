import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyListingDetail, resolveListingImageUrl, submitMyListingForApproval } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import UserShell from "../layouts/UserShell";

function formatDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

export default function ListingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [status, setStatus] = useState("Đang tải...");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitForApproval = async () => {
    if (!id) return;
    setSubmitting(true);
    setError("");
    try {
      const updated = await submitMyListingForApproval(id);
      setListing(updated);
    } catch {
      setError("Không thể gửi duyệt bài đăng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    getMyListingDetail(id)
      .then((data) => {
        setListing(data);
        setStatus("");
      })
      .catch(() => {
        setError("Không thể tải chi tiết bài đăng.");
        setStatus("");
      });
  }, [id]);

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Chi tiết bài đăng</h1>
            <p className="mt-1 text-sm text-slate-500">Thông tin chi tiết bài đăng của bạn.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/my-listings")}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Quay lại danh sách
            </button>
            <button
               onClick={() => navigate(`/my-listings/${id}/edit`)}
               className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
             >
               Chỉnh sửa
             </button>
            {(listing?.status === "DRAFT" || listing?.status === "REJECTED") && (
              <button
                disabled={submitting}
                onClick={handleSubmitForApproval}
                className="rounded-full bg-[#ff6a3d] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "Gửi duyệt"}
              </button>
            )}
             <button
               onClick={() => navigate("/my-listings/new")}
               className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
             >
               Tạo mới
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

        {listing && (
          <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,136,0,0.4)]">
            {(() => {
              const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
              return (
                <>
                  {listing.images && listing.images.length > 0 && (
                    <div className="mb-6 grid gap-3 sm:grid-cols-2">
                      {listing.images.map((image) => (
                        <div
                          key={image.id}
                          className="aspect-[4/3] overflow-hidden rounded-2xl border border-orange-100 bg-orange-50"
                        >
                          <img
                            src={resolveListingImageUrl(image.imageUrl)}
                            alt={listing.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-800">{listing.title}</h2>
                      <p className="mt-2 text-sm text-slate-500">{location || "Chưa cập nhật"}</p>
                    </div>
                    {(() => {
                      let badgeClass = "bg-slate-100 text-slate-700";
                      let badgeText = listing.status;
                      if (listing.status === "DRAFT") {
                        badgeClass = "bg-slate-100 text-slate-700";
                        badgeText = "Bản nháp";
                      } else if (listing.status === "PENDING") {
                        badgeClass = "bg-amber-100 text-amber-700";
                        badgeText = "Chờ duyệt";
                      } else if (listing.status === "APPROVED") {
                        badgeClass = "bg-green-100 text-green-700";
                        badgeText = "Đã duyệt";
                      } else if (listing.status === "REJECTED") {
                        badgeClass = "bg-red-100 text-red-700";
                        badgeText = "Từ chối";
                      }
                      return (
                        <span className={`rounded-full px-4 py-2 text-xs font-semibold ${badgeClass}`}>
                          {badgeText}
                        </span>
                      );
                    })()}
                  </div>

                  <p className="mt-4 text-sm text-slate-600">{listing.description}</p>

                  <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Giá thuê</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">
                        {listing.rentPrice.toLocaleString("vi-VN")} VND
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Diện tích</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">
                        {listing.roomAreaSqm ? `${listing.roomAreaSqm} m2` : "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Ngày tạo</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">{formatDateTime(listing.createdAt)}</p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Ngày có thể ở</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">
                        {formatDate(listing.availableFrom) || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 md:col-span-2">
                      <p className="text-xs uppercase text-orange-400">Địa chỉ</p>
                      <p className="mt-1 text-lg font-semibold text-slate-800">
                        {listing.address || "Chưa cập nhật"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-3">
                    <div className="rounded-2xl border border-orange-100 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Giới tính ưu tiên</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">
                        {listing.preferredGender || "Không yêu cầu"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Loại phòng</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">
                        {listing.roomType || "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-100 px-4 py-3">
                      <p className="text-xs uppercase text-orange-400">Sức chứa</p>
                      <p className="mt-1 text-base font-semibold text-slate-800">
                        {listing.currentOccupants || 0}/{listing.maxOccupants || 0}
                      </p>
                    </div>
                  </div>

                  {listing.rejectionReason && (
                    <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      Lý do từ chối: {listing.rejectionReason}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </UserShell>
  );
}
