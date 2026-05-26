import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchPublicListingDetail, resolveListingImageUrl } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

export default function PublicListingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchPublicListingDetail(id)
      .then((data) => {
        setListing(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải thông tin chi tiết phòng hoặc phòng chưa được kiểm duyệt.");
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col gap-6 px-6 pb-16 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chi tiết phòng ở ghép</h1>
            <p className="mt-1 text-sm text-slate-500">Thông tin chi tiết về không gian sống và yêu cầu ghép phòng.</p>
          </div>
          <button
            onClick={() => navigate("/listings")}
            className="rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 transition shadow-sm"
          >
            ← Quay lại danh sách
          </button>
        </header>

        {loading && (
          <div className="flex h-64 items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></span>
              <p className="mt-2 text-sm text-slate-500 font-semibold">Đang tải thông tin chi tiết...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-100 bg-white px-6 py-8 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {listing && (
          <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]">
            {listing.images && listing.images.length > 0 && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                {listing.images.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-[4/3] overflow-hidden rounded-[20px] border border-orange-50 bg-orange-50/50"
                  >
                    <img
                      src={resolveListingImageUrl(image.imageUrl)}
                      alt={listing.title}
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{listing.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  📍 {[listing.ward, listing.district, listing.city].filter(Boolean).join(", ") || "Chưa rõ khu vực"}
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-4 py-2 text-xs font-bold text-green-700 border border-green-100 shadow-sm">
                ✓ Đã qua kiểm duyệt
              </span>
            </div>

            <hr className="my-6 border-orange-50" />

            <div>
              <h3 className="text-lg font-bold text-slate-800">Mô tả phòng ở ghép</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            <hr className="my-6 border-orange-50" />

            <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/30 px-5 py-4">
                <p className="text-xs uppercase font-bold text-orange-400">Giá thuê mỗi tháng</p>
                <p className="mt-1 text-2xl font-black text-[#ff6a3d]">
                  {listing.rentPrice.toLocaleString("vi-VN")} VND
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/30 px-5 py-4">
                <p className="text-xs uppercase font-bold text-orange-400">Diện tích phòng</p>
                <p className="mt-1 text-2xl font-black text-slate-850">
                  {listing.roomAreaSqm ? `${listing.roomAreaSqm} m²` : "Chưa cập nhật"}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/30 px-5 py-4">
                <p className="text-xs uppercase font-bold text-orange-400">Địa chỉ cụ thể</p>
                <p className="mt-1 text-base font-bold text-slate-800">
                  {listing.address || "Chưa cập nhật địa chỉ"}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50/30 px-5 py-4">
                <p className="text-xs uppercase font-bold text-orange-400">Ngày có thể chuyển vào</p>
                <p className="mt-1 text-base font-bold text-slate-800">
                  {formatDate(listing.availableFrom) || "Dọn vào ở ngay"}
                </p>
              </div>
            </div>

            <hr className="my-6 border-orange-50" />

            <div className="grid gap-4 text-sm text-slate-600 md:grid-cols-3">
              <div className="rounded-2xl border border-orange-100 px-4 py-3 text-center">
                <p className="text-xs uppercase font-bold text-orange-400">Loại phòng</p>
                <p className="mt-1.5 text-base font-bold text-slate-800">
                  {listing.roomType || "Chưa xác định"}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 px-4 py-3 text-center">
                <p className="text-xs uppercase font-bold text-orange-400">Giới tính ưu tiên</p>
                <p className="mt-1.5 text-base font-bold text-slate-850">
                  {listing.preferredGender || "Nam hoặc Nữ"}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-100 px-4 py-3 text-center">
                <p className="text-xs uppercase font-bold text-orange-400">Sức chứa phòng</p>
                <p className="mt-1.5 text-base font-bold text-slate-800">
                  {listing.currentOccupants || 0} / {listing.maxOccupants || 4} thành viên
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs font-semibold text-slate-500">
              <span className={`rounded-full px-3 py-1 border ${listing.smokingAllowed ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                {listing.smokingAllowed ? "✓ Cho phép hút thuốc" : "✗ Không hút thuốc"}
              </span>
              <span className={`rounded-full px-3 py-1 border ${listing.petAllowed ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                {listing.petAllowed ? "✓ Cho phép nuôi thú cưng" : "✗ Không nuôi thú cưng"}
              </span>
            </div>

            <div className="mt-8 rounded-2xl bg-orange-50/50 border border-orange-150 p-5 text-center">
              <h4 className="text-base font-bold text-slate-800">💡 Hướng dẫn liên hệ ghép phòng</h4>
              <p className="mt-2 text-xs text-slate-500">
                Nhằm bảo mật thông tin cá nhân của người dùng, vui lòng gửi tin nhắn hoặc kết nối thông qua số điện thoại tài khoản tạo bài đăng (bạn có thể bấm xem thông tin ở tài khoản chủ phòng).
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
