import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, CheckCircle2, CircleCheck, CircleX, Copy, Mail, MapPinned, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { getMyListingDetail, resolveListingImageUrl, submitMyListingForApproval } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import { trackEvent } from "../api/services/analytics";
import UserShell from "../layouts/UserShell";

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function renderDescription(desc: string) {
  if (!desc) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = desc.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 underline font-semibold hover:text-orange-700 break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export default function ListingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [status, setStatus] = useState("Đang tải...");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch {
      console.error("Failed to copy phone number");
    }
  };

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

  const handlePrevImg = () => {
    if (!listing || !listing.images || listing.images.length === 0) return;
    setSelectedImgIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    if (!listing || !listing.images || listing.images.length === 0) return;
    setSelectedImgIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chi tiết bài đăng cá nhân</h1>
            <p className="mt-1 text-sm text-slate-700">Thông tin quản lý và phê duyệt bài viết phòng ở ghép của bạn.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/my-listings")}
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 transition"
            >
              Quay lại danh sách
            </button>
            <button
               onClick={() => navigate(`/my-listings/${id}/edit`)}
               className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50 transition"
             >
               Chỉnh sửa
             </button>
            {(listing?.status === "DRAFT" || listing?.status === "REJECTED") && (
              <button
                disabled={submitting}
                onClick={handleSubmitForApproval}
                className="rounded-full bg-[#ff6a3d] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-50 hover:bg-[#e65a2f] transition"
              >
                {submitting ? "Đang gửi..." : "Gửi duyệt"}
              </button>
            )}
             <button
               onClick={() => navigate("/my-listings/new")}
               className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 transition animate-pulse"
             >
               Tạo mới
             </button>
          </div>
        </header>

        {status && (
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-slate-700">
            {status}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-white px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {listing && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.75fr] items-start">
            {/* Left Column: Core content */}
            <div className="space-y-6">
              {/* Image Slider Section */}
              <div className="rounded-[24px] overflow-hidden border border-orange-100 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]">
                {listing.images && listing.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image View */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-orange-50">
                      <img
                        src={resolveListingImageUrl(listing.images[selectedImgIdx].imageUrl)}
                        alt={listing.title}
                        className="h-full w-full object-cover select-none"
                      />
                      
                      {listing.images.length > 1 && (
                        <>
                          {/* Prev Button */}
                          <button
                            onClick={handlePrevImg}
                            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-white font-extrabold hover:bg-slate-950 transition"
                          >
                            ‹
                          </button>
                          {/* Next Button */}
                          <button
                            onClick={handleNextImg}
                            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-white font-extrabold hover:bg-slate-950 transition"
                          >
                            ›
                          </button>
                          {/* Counter Badge */}
                          <span className="absolute bottom-4 right-4 rounded-full bg-slate-900/70 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                            <span className="inline-flex items-center gap-1.5">
                              <Camera className="h-3.5 w-3.5" />
                              {selectedImgIdx + 1} / {listing.images.length}
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {listing.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                        {listing.images.map((image, idx) => (
                          <button
                            key={image.id}
                            onClick={() => setSelectedImgIdx(idx)}
                            className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                              selectedImgIdx === idx
                                ? "border-orange-500 shadow-md shadow-orange-100"
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={resolveListingImageUrl(image.imageUrl)}
                              alt="Thumbnail"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full flex items-center justify-center rounded-2xl bg-orange-50 text-orange-300 font-bold text-sm">
                    Bài đăng không đính kèm hình ảnh
                  </div>
                )}
              </div>

              {/* Listing Details Panel */}
              <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 uppercase leading-snug">
                      {listing.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      Địa chỉ: {listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {(() => {
                    let badgeClass = "bg-slate-100 text-slate-700 border border-slate-200";
                    let badgeText = listing.status;
                    if (listing.status === "DRAFT") {
                      badgeClass = "bg-slate-100 text-slate-700 border border-slate-200";
                      badgeText = "Bản nháp";
                    } else if (listing.status === "PENDING") {
                      badgeClass = "bg-amber-100 text-amber-700 border border-amber-200";
                      badgeText = "Chờ duyệt";
                    } else if (listing.status === "APPROVED") {
                      badgeClass = "bg-green-100 text-green-700 border border-green-200";
                      badgeText = "Đã duyệt";
                    } else if (listing.status === "REJECTED") {
                      badgeClass = "bg-red-100 text-red-700 border border-red-200";
                      badgeText = "Từ chối";
                    }
                    return (
                      <span className={`rounded-full px-4 py-2 text-xs font-semibold ${badgeClass}`}>
                        {badgeText}
                      </span>
                    );
                  })()}
                </div>

                {/* Key Metrics */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px] rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase text-orange-400">Giá thuê</p>
                    <p className="text-xl font-black text-[#ff6a3d] mt-1">
                      {listing.rentPrice.toLocaleString("vi-VN")} đ/tháng
                    </p>
                  </div>
                  <div className="flex-1 min-w-[120px] rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase text-orange-400">Diện tích</p>
                    <p className="text-xl font-black text-slate-800 mt-1">
                      {listing.roomAreaSqm ? `${listing.roomAreaSqm} m²` : "Chưa rõ"}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[120px] rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase text-orange-400">Cập nhật</p>
                    <p className="text-sm font-black text-slate-700 mt-2">
                      {formatDate(listing.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Properties Table */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">Thông tin thuộc tính</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">Quận/Huyện:</span>
                      <strong className="text-slate-800">{listing.district || "Chưa cập nhật"}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">Khu vực:</span>
                      <strong className="text-slate-800">{listing.ward || "Chưa cập nhật"}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">Mã tin đăng:</span>
                      <strong className="text-[#ff6a3d]">#{listing.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">Loại phòng:</span>
                      <strong className="text-slate-800">{listing.roomType || "Phòng trọ ở ghép"}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-700">Đối tượng ưu tiên:</span>
                      <strong className="text-slate-800">{listing.preferredGender || "Không yêu cầu"}</strong>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">Thông tin mô tả</h3>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {renderDescription(listing.description)}
                  </div>
                </div>

                {/* Features Badges */}
                <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-100">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${listing.smokingAllowed ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    {listing.smokingAllowed ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                    {listing.smokingAllowed ? "Cho phép hút thuốc" : "Không hút thuốc"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${listing.petAllowed ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                    {listing.petAllowed ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                    {listing.petAllowed ? "Nuôi thú cưng" : "Không nuôi thú cưng"}
                  </span>
                </div>

                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-100">
                    <h3 className="w-full text-base font-bold text-slate-800">Tiện nghi</h3>
                    {listing.amenities.map((amenity) => (
                      <span key={amenity.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-orange-50 border-orange-100 text-orange-700">
                        <CircleCheck className="h-3.5 w-3.5" />
                        {amenity.name}
                      </span>
                    ))}
                  </div>
                )}

                {listing.rejectionReason && (
                  <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 text-sm text-red-600">
                    <strong>Lý do từ chối duyệt bài:</strong> {listing.rejectionReason}
                  </div>
                )}

                {/* Embedded Map Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">Vị trí & bản đồ</h3>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-600"><MapPinned className="h-3.5 w-3.5 text-orange-500" />Địa chỉ: <span className="font-semibold text-slate-800">{listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ")}</span></p>
                  <div className="h-72 w-full overflow-hidden rounded-2xl border border-orange-100">
                    <iframe
                      title="Google Maps"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ")
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>

                {/* Notice Box */}
                <div className="rounded-2xl bg-[#fff7f2] border border-orange-100 p-4 text-left text-xs space-y-1.5 text-slate-500 leading-relaxed">
                  <p className="font-bold text-slate-700 text-center">💡 Lưu ý quan trọng:</p>
                  <p>• Chỉ đặt cọc giữ chỗ khi đã xác thực danh tính chủ nhà và có thỏa thuận biên nhận rõ ràng.</p>
                  <p>• Kiểm tra kỹ điều khoản hợp đồng trước khi thực hiện ký kết.</p>
                </div>
              </div>

              {/* Mobile Contact Info Card (renders at the end, hidden on desktop) */}
              <div className="lg:hidden rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] text-center space-y-4">
                <h3 className="text-base font-bold text-slate-800">Thông tin liên hệ</h3>
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-full border border-orange-200 bg-orange-100">
                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-orange-600">
                      {listing.ownerName?.slice(0, 1).toUpperCase() || "C"}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">{listing.ownerName || "Chủ phòng trọ"}</h4>
                    <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-slate-600"><Mail className="h-3.5 w-3.5" />{listing.ownerEmail || "Không có email"}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => listing?.ownerPhone && handleCopyPhone(listing.ownerPhone)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff6a3d] text-white py-2.5 text-sm font-bold shadow-sm transition hover:bg-[#e65a2f] cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{listing?.ownerPhone || "Chưa có SĐT"}</span>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {copiedPhone === listing?.ownerPhone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                  {listing?.ownerPhone && <a
                    href={`https://zalo.me/${listing.ownerPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (listing?.id) {
                        trackEvent({
                          eventName: "listing_zalo_click",
                          listingId: listing.id,
                          district: listing.district || null,
                        });
                      }
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 text-sm font-bold shadow-sm transition text-center"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Nhắn Zalo
                  </a>}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Contact Sidebar (Desktop Only) */}
            <aside className="hidden lg:block sticky top-6 space-y-6">
              <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] text-center space-y-5">
                <div>
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-ping"></span>
                  <span className="text-xs font-bold text-slate-600">CHỦ BÀI ĐĂNG</span>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-full border border-orange-200 bg-orange-100">
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-orange-600">
                      {listing.ownerName?.slice(0, 1).toUpperCase() || "C"}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{listing.ownerName || "Chủ phòng trọ"}</h4>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-700 border border-green-100 mt-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Đang hoạt động
                    </span>
                  </div>
                </div>

                <hr className="border-orange-50" />

                <div className="space-y-3">
                  <button
                    onClick={() => listing?.ownerPhone && handleCopyPhone(listing.ownerPhone)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6a3d] text-white py-3 text-base font-black shadow-md shadow-orange-100 transition hover:bg-[#e65a2f] cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>{listing?.ownerPhone || "Chưa có SĐT"}</span>
                    <div className="ml-1 flex h-5 w-5 items-center justify-center">
                      {copiedPhone === listing?.ownerPhone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </div>
                  </button>
                  {listing?.ownerPhone && <a
                    href={`https://zalo.me/${listing.ownerPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (listing?.id) {
                        trackEvent({
                          eventName: "listing_zalo_click",
                          listingId: listing.id,
                          district: listing.district || null,
                        });
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-bold shadow-md shadow-blue-100 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Nhắn Zalo
                  </a>}
                </div>  
              </div>
            </aside>
          </div>
        )}
      </div>
    </UserShell>
  );
}
