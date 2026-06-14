import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, Camera, CircleCheck, CircleX, Copy, ExternalLink, Info, MapPinned, MessageCircle, Phone, Send, ShieldCheck, Sparkles, Share2, Flag } from "lucide-react";
import { fetchPublicListingDetail, resolveListingImageUrl, toggleSaveListing, reportListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "Vài giây trước";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
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

const REPORT_REASONS = [
  "Tin có dấu hiệu lừa đảo",
  "Tin trùng lặp nội dung",
  "Không liên hệ được chủ tin đăng",
  "Thông tin không đúng thực tế (giá, diện tích, hình ảnh...)",
  "Lý do khác",
];

export default function PublicListingDetailPage() {
  const MAX_THUMBNAILS = 8;
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTab, setMediaModalTab] = useState<"images" | "map">("images");
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportPhone, setReportPhone] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPublicListingDetail(id)
      .then((data) => {
        setListing(data);
        setIsSaved(data.isSaved || false);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải thông tin chi tiết phòng hoặc phòng chưa được kiểm duyệt.");
        setLoading(false);
      });
  }, [id]);

  const handleToggleSave = useCallback(async () => {
    if (!listing?.id) return;
    setSaving(true);
    try {
      const res = await toggleSaveListing(listing.id);
      setIsSaved(res.isSaved);
    } catch {
      alert("Không thể lưu bài đăng. Vui lòng đăng nhập.");
    } finally {
      setSaving(false);
    }
  }, [listing?.id]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      alert("Không thể sao chép đường link");
    }
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!listing?.id || !reportReason) return;
    setSubmittingReport(true);
    try {
      await reportListing(listing.id, {
        reason: reportReason,
        description: reportDescription || null,
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setReportReason("");
        setReportDescription("");
        setReportName("");
        setReportPhone("");
      }, 2000);
    } catch {
      alert("Không thể gửi báo cáo");
    } finally {
      setSubmittingReport(false);
    }
  }, [listing?.id, reportReason, reportDescription]);

  const handlePrevImg = () => {
    if (!listing || !listing.images || listing.images.length === 0) return;
    setSelectedImgIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    if (!listing || !listing.images || listing.images.length === 0) return;
    setSelectedImgIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  const openImageModal = (imageIndex: number) => {
    setSelectedImgIdx(imageIndex);
    setMediaModalTab("images");
    setIsMediaModalOpen(true);
  };

  const openMapModal = () => {
    setMediaModalTab("map");
    setIsMediaModalOpen(true);
  };

  const listingAddress = listing?.address || [listing?.ward, listing?.district, listing?.city].filter(Boolean).join(", ");

  useEffect(() => {
    if (!isMediaModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMediaModalOpen(false);
      }
      if (mediaModalTab !== "images") return;
      if (event.key === "ArrowLeft") handlePrevImg();
      if (event.key === "ArrowRight") handleNextImg();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMediaModalOpen, mediaModalTab, listing]);

  const activeLabel = listing?.ownerLastActive
    ? `Đã hoạt động ${timeAgo(listing.ownerLastActive)}`
    : "Đang hoạt động";



  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-6 pb-16 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chi tiết phòng ở ghép</h1>
            <p className="mt-1 text-sm text-slate-700">Thông tin chi tiết về không gian sống và yêu cầu ghép phòng.</p>
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
              <p className="mt-2 text-sm text-slate-700 font-semibold">Đang tải thông tin chi tiết...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-100 bg-white px-6 py-8 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {listing && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.75fr] items-start">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Image Slider */}
              <div className="rounded-[24px] overflow-hidden border border-orange-100 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]">
                {listing.images && listing.images.length > 0 ? (
                  <div className="space-y-4">
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-orange-50">
                      <img
                        src={resolveListingImageUrl(listing.images[selectedImgIdx].imageUrl)}
                        alt={listing.title}
                        className="h-full w-full object-cover select-none cursor-zoom-in"
                        onClick={() => openImageModal(selectedImgIdx)}
                      />
                      {listing.images.length > 1 && (
                        <>
                          <button onClick={handlePrevImg} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-white font-extrabold hover:bg-slate-950 transition">‹</button>
                          <button onClick={handleNextImg} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 text-white font-extrabold hover:bg-slate-950 transition">›</button>
                          <span className="absolute bottom-4 right-4 rounded-full bg-slate-900/70 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                            <span className="inline-flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" />{selectedImgIdx + 1} / {listing.images.length}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {listing.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                        {listing.images.slice(0, MAX_THUMBNAILS).map((image, idx) => {
                          const extraCount = listing.images.length - MAX_THUMBNAILS;
                          const isLastVisible = idx === MAX_THUMBNAILS - 1;
                          const shouldShowExtra = isLastVisible && extraCount > 0;
                          return (
                            <button
                              key={image.id}
                              onClick={() => setSelectedImgIdx(idx)}
                              className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${selectedImgIdx === idx ? "border-orange-500 shadow-md shadow-orange-100" : "border-transparent opacity-60 hover:opacity-100"}`}
                            >
                              <img src={resolveListingImageUrl(image.imageUrl)} alt="Thumbnail" className="h-full w-full object-cover" />
                              {shouldShowExtra && (
                                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/65 text-sm font-bold text-white">
                                  +{extraCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[16/9] w-full flex items-center justify-center rounded-2xl bg-orange-50 text-orange-300 font-bold text-sm">
                    Bài đăng không đính kèm hình ảnh
                  </div>
                )}
              </div>

              {/* Listing Details */}
              <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] space-y-6">
                <div>
                  {listing.promoExpiresAt && new Date(listing.promoExpiresAt) > new Date() && (
                  <span className="inline-flex items-center gap-1.5 rounded bg-red-100 border border-red-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-red-700 tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    {listing.promoType === "premium" ? "TIN VIP CAO CẤP" : "TIN VIP NỔI BẬT"}
                  </span>
                  )}
                  <h2 className="mt-2 text-xl md:text-2xl font-extrabold text-red-600 uppercase leading-snug">{listing.title}</h2>
                  <p className="mt-2 text-xs text-slate-600 font-medium">
                    Địa chỉ: {listing.address || [listing.ward, listing.district, listing.city].filter(Boolean).join(", ")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[120px] rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase text-orange-400">Giá thuê</p>
                    <p className="text-xl font-black text-[#ff6a3d] mt-1">{listing.rentPrice.toLocaleString("vi-VN")} đ/tháng</p>
                  </div>
                  <div className="flex-1 min-w-[120px] rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase text-orange-400">Diện tích</p>
                    <p className="text-xl font-black text-slate-800 mt-1">{listing.roomAreaSqm ? `${listing.roomAreaSqm} m²` : "Chưa rõ"}</p>
                  </div>
                  <div className="flex-1 min-w-[120px] rounded-2xl bg-orange-50/50 p-4 border border-orange-100">
                    <p className="text-[10px] font-bold uppercase text-orange-400">Cập nhật</p>
                    <p className="text-sm font-black text-slate-700 mt-2">{formatDate(listing.updatedAt)}</p>
                  </div>
                </div>

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
                    {!listing.source && (
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="text-slate-500">Số lượng:</span>
                        <strong className="text-slate-800">{listing.currentOccupants || 0} / {listing.maxOccupants || 0} người</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">Thông tin mô tả</h3>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{renderDescription(listing.description)}</div>
                </div>

                {!listing.source && (
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
                )}

                {listing.amenities && listing.amenities.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h3 className="text-base font-bold text-slate-800">Tiện nghi</h3>
                    <div className="flex flex-wrap gap-2">
                      {listing.amenities.map((amenity) => (
                        <span key={amenity.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border bg-orange-50 border-orange-100 text-orange-700">
                          <CircleCheck className="h-3.5 w-3.5" />
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-base font-bold text-slate-800">Vị trí & bản đồ</h3>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <p className="inline-flex items-center gap-1.5">
                      <MapPinned className="h-3.5 w-3.5 text-orange-500" />
                      Địa chỉ: <span className="font-semibold text-slate-700">{listingAddress || "Chưa cập nhật"}</span>
                    </p>
                    <button onClick={openMapModal} className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 font-semibold text-orange-700 transition hover:bg-orange-100">
                      Xem bản đồ lớn
                    </button>
                  </div>
                  <div className="h-72 w-full overflow-hidden rounded-2xl border border-orange-100">
                    <iframe title="Google Maps" width="100%" height="100%" style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(listingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen></iframe>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#fff7f2] border border-orange-100 p-4 text-left text-xs space-y-1.5 text-slate-500 leading-relaxed">
                  <p className="font-bold text-slate-700 text-center">💡 Lưu ý quan trọng:</p>
                  <p>• Chỉ đặt cọc giữ chỗ khi đã xác thực danh tính chủ nhà và có thỏa thuận biên nhận rõ ràng.</p>
                  <p>• Kiểm tra kỹ điều khoản hợp đồng trước khi thực hiện ký kết.</p>
                </div>
              </div>
            </div>

            {/* Mobile Contact + Actions (hidden on lg+) */}
            <div className="lg:hidden space-y-4">
              {listing.source ? (
                <div className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] text-center space-y-5">
                  <div>
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 mr-2"></span>
                    <span className="text-xs font-bold text-slate-600">THÔNG TIN LIÊN HỆ</span>
                  </div>
                  <p className="text-sm text-slate-700">Thông tin liên hệ được quản lý tại bài đăng gốc.</p>
                  <a href={listing.source} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white py-3 text-sm font-bold shadow-sm transition">
                    <ExternalLink className="h-4 w-4" />
                    Xem bài đăng gốc
                  </a>
                </div>
              ) : (
                <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] text-center space-y-4">
                  <span className="text-xs font-bold text-slate-600">CHỦ BÀI ĐĂNG</span>
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-full border border-orange-200 bg-orange-100">
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-orange-600">
                        {listing.ownerName?.slice(0, 1).toUpperCase() || "C"}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{listing.ownerName || "Chủ phòng trọ"}</h4>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-700 border border-green-100 mt-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {activeLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${listing.ownerPhone || ""}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#ff6a3d] hover:bg-[#e65a2f] text-white py-2.5 text-sm font-bold shadow-sm transition">
                      <Phone className="h-4 w-4" />
                      {listing.ownerPhone || "Chưa có SĐT"}
                    </a>
                    {listing.ownerPhone && <a href={`https://zalo.me/${listing.ownerPhone}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 text-sm font-bold shadow-sm transition">
                      <MessageCircle className="h-4 w-4" />
                      Nhắn Zalo
                    </a>}
                  </div>
                </div>
              )}

              {/* Mobile Action Buttons */}
              <div className="rounded-[24px] border border-orange-100 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]">
                <div className="flex items-center justify-center gap-3">
                  <button onClick={handleToggleSave} disabled={saving}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-orange-50 transition">
                    {isSaved ? <BookmarkCheck className="h-5 w-5 text-orange-500" /> : <Bookmark className="h-5 w-5" />}
                    {isSaved ? "Đã lưu" : "Lưu tin"}
                  </button>
                  <button onClick={handleCopyLink}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-orange-50 transition">
                    <Share2 className="h-5 w-5" />
                    {shareCopied ? "Đã copy" : "Chia sẻ"}
                  </button>
                  <button onClick={() => { setReportReason(""); setReportDescription(""); setReportName(""); setReportPhone(""); setReportSuccess(false); setShowReportModal(true); }}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-orange-50 transition">
                    <Flag className="h-5 w-5" />
                    Báo cáo
                  </button>
                </div>
              </div>

              {/* Mobile Share card */}
              <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Share2 className="h-4 w-4 text-blue-500" />Chia sẻ bài đăng</h3>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <input readOnly value={window.location.href} className="flex-1 bg-transparent text-xs text-slate-600 outline-none truncate px-1" />
                  <button onClick={handleCopyLink} className="flex-shrink-0 rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" />{shareCopied ? "Đã copy" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Sidebar */}
            <aside className="hidden lg:block sticky top-6 space-y-6">
              {/* Contact Card */}
              {listing.source ? (
                <div className="rounded-[24px] border border-blue-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] text-center space-y-5">
                  <div>
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 mr-2"></span>
                    <span className="text-xs font-bold text-slate-600">THÔNG TIN LIÊN HỆ</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-700">
                    <p className="leading-relaxed">Thông tin liên hệ được quản lý tại bài đăng gốc.</p>
                    <p className="text-xs text-slate-400">Xem chi tiết và liên hệ người đăng tại:</p>
                  </div>
                  <a href={listing.source} target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-bold shadow-md shadow-blue-100 transition">
                    <ExternalLink className="h-4 w-4" />
                    Xem bài đăng gốc
                  </a>
                  <div className="rounded-2xl bg-[#fff7f2] border border-orange-100 p-4 text-left text-xs space-y-1.5 text-slate-600 leading-relaxed">
                    <p className="inline-flex w-full items-center justify-center gap-1.5 font-bold text-slate-700 text-center"><Info className="h-3.5 w-3.5" />Lưu ý quan trọng:</p>
                    <p>• Thông tin từ bài đăng được thu thập từ nguồn bên ngoài, vui lòng kiểm tra kỹ trước khi liên hệ.</p>
                    <p>• Không đặt cọc khi chưa xác thực danh tính chủ nhà.</p>
                  </div>
                </div>
              ) : (
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
                        {activeLabel}
                      </span>
                      {listing.ownerListingsCount !== undefined && (
                        <p className="text-[10px] text-slate-400 mt-1">{listing.ownerListingsCount} bài đăng</p>
                      )}
                    </div>
                  </div>
                  <hr className="border-orange-50" />
                  <div className="space-y-3">
                    <a href={`tel:${listing.ownerPhone || ""}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6a3d] hover:bg-[#e65a2f] text-white py-3 text-base font-black shadow-md shadow-orange-100 transition">
                      <Phone className="h-4 w-4" />
                      {listing.ownerPhone || "Chưa có SĐT"}
                    </a>
                    {listing.ownerPhone && <a href={`https://zalo.me/${listing.ownerPhone}`} target="_blank" rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white py-3 text-base font-bold shadow-md shadow-blue-100 transition">
                      <MessageCircle className="h-4 w-4" />
                      Nhắn Zalo
                    </a>}
                  </div>
                </div>
              )}

              {/* Action Buttons Card */}
              <div className="rounded-[24px] border border-orange-100 bg-white p-4 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)]">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleToggleSave}
                    disabled={saving}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:border-orange-200 transition"
                  >
                    {isSaved ? <BookmarkCheck className="h-5 w-5 text-orange-500" /> : <Bookmark className="h-5 w-5" />}
                    {isSaved ? "Đã lưu" : "Lưu tin"}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:border-orange-200 transition"
                  >
                    <Share2 className="h-5 w-5" />
                    {shareCopied ? "Đã copy" : "Chia sẻ"}
                  </button>
                  <button
                    onClick={() => {
                      setReportReason("");
                      setReportDescription("");
                      setReportName("");
                      setReportPhone("");
                      setReportSuccess(false);
                      setShowReportModal(true);
                    }}
                    className="flex flex-1 flex-col items-center gap-1 rounded-2xl border border-orange-100 bg-white px-3 py-3 text-xs font-semibold text-slate-600 hover:bg-orange-50 hover:border-orange-200 transition"
                  >
                    <Flag className="h-5 w-5" />
                    Báo cáo
                  </button>
                </div>
              </div>

              {/* Share Card */}
              <div className="rounded-[24px] border border-blue-100 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] space-y-4">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-blue-500" />
                  Chia sẻ bài đăng
                </h3>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <input
                    readOnly
                    value={window.location.href}
                    className="flex-1 bg-transparent text-xs text-slate-600 outline-none truncate px-1"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex-shrink-0 rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {shareCopied ? "Đã copy" : "Copy"}
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {isMediaModalOpen && listing && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm px-4 py-6 md:px-8"
          onClick={() => setIsMediaModalOpen(false)}>
          <div className="mx-auto flex h-full w-full max-w-[1220px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="w-20"></div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-800 p-1">
                <button onClick={() => setMediaModalTab("images")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mediaModalTab === "images" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>Hình ảnh</button>
                <button onClick={() => setMediaModalTab("map")}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mediaModalTab === "map" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>Bản đồ</button>
              </div>
              <button onClick={() => setIsMediaModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xl text-white transition hover:bg-slate-700">×</button>
            </div>
            <div className="flex-1 overflow-hidden p-3 md:p-4">
              {mediaModalTab === "images" ? (
                <div className="flex h-full flex-col gap-3">
                  <div className="relative flex-1 overflow-hidden rounded-xl bg-slate-950">
                    <img src={resolveListingImageUrl(listing.images[selectedImgIdx].imageUrl)} alt={listing.title} className="h-full w-full object-contain" />
                    {listing.images.length > 1 && (
                      <>
                        <button onClick={handlePrevImg} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/70 text-2xl text-white hover:bg-slate-800">‹</button>
                        <button onClick={handleNextImg} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/70 text-2xl text-white hover:bg-slate-800">›</button>
                        <div className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-semibold text-white">{selectedImgIdx + 1} / {listing.images.length}</div>
                      </>
                    )}
                  </div>
                  {listing.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {listing.images.map((image, idx) => (
                        <button key={image.id} onClick={() => setSelectedImgIdx(idx)}
                          className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${selectedImgIdx === idx ? "border-orange-500" : "border-transparent opacity-70 hover:opacity-100"}`}>
                          <img src={resolveListingImageUrl(image.imageUrl)} alt={`Ảnh phòng ${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-hidden rounded-xl border border-slate-700">
                  <iframe title="Google Maps Fullscreen" width="100%" height="100%" style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(listingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen></iframe>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-8"
          onClick={() => { if (!submittingReport) setShowReportModal(false); }}>
          <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { if (!submittingReport) setShowReportModal(false); }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-lg">×</button>

            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Phản ánh tin đăng
            </h2>

            {reportSuccess ? (
              <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-6 text-center text-sm text-green-700 font-semibold">
                Gửi báo cáo thành công!
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-3">Lý do phản ánh:</p>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => (
                      <label key={r}
                        className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${reportReason === r ? "border-red-300 bg-red-50" : "border-slate-100 hover:border-slate-200"}`}>
                        <input type="radio" name="reportReasonModal" value={r}
                          checked={reportReason === r}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="mt-0.5 accent-red-500" />
                        <span className="text-sm text-slate-700">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Mô tả thêm</p>
                  <textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-red-300 resize-none"
                    placeholder="Nhập chi tiết lý do báo cáo..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Họ và tên</p>
                    <input value={reportName} onChange={(e) => setReportName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300"
                      placeholder="Nhập họ tên" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Số điện thoại</p>
                    <input value={reportPhone} onChange={(e) => setReportPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300"
                      placeholder="Nhập số điện thoại" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { if (!submittingReport) setShowReportModal(false); }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                    Huỷ
                  </button>
                  <button onClick={handleSubmitReport} disabled={!reportReason || submittingReport}
                    className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white py-3 text-sm font-bold transition">
                    <Send className="h-4 w-4" />
                    {submittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
