import { useCallback, useEffect, useState } from "react";
import type { SoftFilterResult } from "../api/services/lifestyle";
import { FILTER_LINEAR_OPTIONS, PREF_OPTIONS } from "./lifestyleOptions";
import { useNavigate, useParams } from "react-router-dom";
import { Bookmark, BookmarkCheck, Camera, CheckCircle2, CircleCheck, CircleX, Copy, ExternalLink, Home, ChevronRight, Info, MapPinned, MessageCircle, Phone, Send, ShieldCheck, Sparkles, Share2, Flag } from "lucide-react";
import { fetchPublicListingDetail, fetchPublicListings, resolveListingImageUrl, toggleSaveListing, reportListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { trackEvent } from "../api/services/analytics";

function formatDate(value: string | null | undefined) {
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportName, setReportName] = useState("");
  const [reportPhone, setReportPhone] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [softFilterResult, setSoftFilterResult] = useState<SoftFilterResult | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      if (listing?.id) {
        trackEvent({
          eventName: "listing_phone_click",
          listingId: listing.id,
          district: listing.district || null,
        });
      }
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch {
      console.error("Failed to copy phone number");
    }
  };

  const handleZaloClick = useCallback(() => {
    if (listing?.id) {
      trackEvent({
        eventName: "listing_zalo_click",
        listingId: listing.id,
        district: listing.district || null,
      });
    }
  }, [listing?.id, listing?.district]);

  useEffect(() => {
    if (!id) return;
    fetchPublicListingDetail(id)
      .then((data) => {
        setListing(data);
        setIsSaved(data.isSaved || false);
        setLoading(false);
        trackEvent({
          eventName: "listing_view",
          listingId: id,
          district: data?.district || null,
          metadata: { source: "detail_page" },
        });
      })
      .catch(() => {
        setError("Không thể tải thông tin chi tiết phòng hoặc phòng chưa được kiểm duyệt.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!listing?.id) return;
    let cancelled = false;

    fetchPublicListings()
      .then((items) => {
        if (cancelled) return;
        const baseDistrict = (listing.district || "").toLowerCase();
        const baseCity = (listing.city || "").toLowerCase();
        const filtered = items
          .filter((item) => item.id !== listing.id)
          .filter((item) => {
            const status = String(item.status || "").toUpperCase();
            return !status || status === "APPROVED" || status === "PUBLISHED";
          })
          .filter((item) => {
            const sameDistrict = baseDistrict && (item.district || "").toLowerCase() === baseDistrict;
            const sameCity = baseCity && (item.city || "").toLowerCase() === baseCity;
            return sameDistrict || sameCity;
          })
          .slice(0, 3);
        setSimilarListings(filtered);
      })
      .catch(() => {
        if (!cancelled) setSimilarListings([]);
      });

    return () => {
      cancelled = true;
    };
  }, [listing?.id, listing?.district, listing?.city]);

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

  const FIELD_FULL_LABELS: Record<string, string> = {
    cleanliness: "Mức độ sạch sẽ",
    ac_usage: "Tần suất sử dụng điều hòa",
    pet: "Thú cưng",
    smoking: "Hút thuốc",
    cooking: "Nấu ăn",
    guest: "Tần suất dẫn bạn bè về phòng",
    home_frequency: "Tần suất ở trong phòng",
    work_schedule: "Thời gian làm việc",
    sharing: "Mức độ chia sẻ đồ dùng",
    noise: "Mức độ giữ yên tĩnh",
    call_frequency: "Tần suất gọi điện/video call",
    game_mic: "Mức độ chơi game voice chat",
  };

  const mapOptionLabel = (field: string, value: string | number | null | undefined): string | null => {
    if (value === null || value === undefined || value === "") return null;
    try {
      // numeric linear options
      const linear = (FILTER_LINEAR_OPTIONS as any)[field];
      if (Array.isArray(linear)) {
        const vNum = typeof value === "string" && !isNaN(Number(value)) ? Number(value) : value;
        const opt = linear.find((o: any) => String(o.value) === String(vNum));
        if (opt) return opt.label;
      }

      // pref options
      const pref = (PREF_OPTIONS as any)[field];
      if (Array.isArray(pref)) {
        const opt = pref.find((o: any) => String(o.value) === String(value));
        if (opt) return opt.label;
      }

      // fallback
      return typeof value === "string" ? value : String(value);
    } catch (e) {
      return typeof value === "string" ? value : String(value);
    }
  };

  const getPrefsFromResult = (result: SoftFilterResult | null) => {
    if (!result?.field_scores) return { good: [], caution: [] };
    const order = [
      "ac_usage",
      "cooking",
      "home_frequency",
      "call_frequency",
      "smoking",
      "pet",
      "cleanliness",
      "guest",
      "noise",
      "game_mic",
      "work_schedule",
      "sharing",
    ];
    const good: Array<any> = [];
    const caution: Array<any> = [];
    for (const field of order) {
      const f = result.field_scores[field];
      if (!f) continue;
      const profileLabel = mapOptionLabel(field, f.profile_value) || String(f.profile_value);
      const prefLabel = mapOptionLabel(field, f.pref_value) || String(f.pref_value);
      const score = typeof f.score === "number" ? f.score : 0;
      const item = { field, profileLabel, prefLabel, score };
      if (score >= 0.75) good.push(item);
      else caution.push(item);
    }
    return { good, caution };
  };

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("softFilterResults");
        if (!raw) return setSoftFilterResult(null);
        const arr = JSON.parse(raw) as SoftFilterResult[];
        if (!Array.isArray(arr)) return setSoftFilterResult(null);
        const found = arr.find((r) => r.id === listing?.id) || null;
        setSoftFilterResult(found);
      } catch (e) {
        console.error("Lỗi khi tải soft filter results:", e);
      }
    };
    load();
    const onUpdate = (e: any) => {
      try {
        const detail = e?.detail as SoftFilterResult[] | undefined;
        if (Array.isArray(detail)) {
          const found = detail.find((r) => r.id === listing?.id) || null;
          setSoftFilterResult(found);
          return;
        }
      } catch {}
      load();
    };
    window.addEventListener("softFilterUpdated", onUpdate as EventListener);
    const onVisibility = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("softFilterUpdated", onUpdate as EventListener);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [listing?.id]);



  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-3">
            <nav className="flex items-center gap-2 text-xs text-slate-500">
              <button onClick={() => navigate("/")} className="flex items-center gap-1 hover:text-[#a55b00] transition">
                <Home className="h-3.5 w-3.5" /> Trang chủ
              </button>
              <ChevronRight className="h-3 w-3" />
              <button onClick={() => navigate("/listings")} className="hover:text-[#a55b00] transition">Phòng trọ</button>
              <ChevronRight className="h-3 w-3" />
              <span className="max-w-[220px] truncate font-medium text-slate-800">{listing?.title || "..."}</span>
            </nav>
          </div>
        </div>

        {loading && (
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-20 flex items-center justify-center">
            <div className="text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#a55b00] border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Đang tải thông tin chi tiết...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-20">
            <div className="rounded-xl border border-red-200 bg-white p-8 text-center text-red-600">{error}</div>
          </div>
        )}

        {listing && (
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-6 lg:py-8">
            <div className="mb-4 text-xs font-medium text-slate-500">
              TP. Hồ Chí Minh <span className="mx-1 text-slate-300">›</span> Quận 7 <span className="mx-1 text-slate-300">›</span> <span className="text-slate-700">{listingAddress || "Căn hộ Sunrise City"}</span>
            </div>

            <section className="space-y-3 mb-8">
              <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] cursor-pointer" onClick={() => openImageModal(selectedImgIdx)}>
                {listing.images && listing.images.length > 0 ? (
                  <>
                    <img
                      src={resolveListingImageUrl(listing.images[selectedImgIdx].imageUrl)}
                      alt={listing.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                    {listing.images.length > 1 && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handlePrevImg(); }} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg backdrop-blur hover:bg-white transition">‹</button>
                        <button onClick={(e) => { e.stopPropagation(); handleNextImg(); }} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg backdrop-blur hover:bg-white transition">›</button>
                        <div className="absolute bottom-4 right-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur flex items-center gap-1.5">
                          <Camera className="h-3.5 w-3.5" /> {selectedImgIdx + 1}/{listing.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex h-full min-h-[330px] items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-500">
                    Bài đăng không đính kèm hình ảnh
                  </div>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(listing.images || []).slice(1, 6).map((image, idx) => (
                  <button key={image.id} className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-[16px] bg-slate-100 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.35)]" onClick={() => openImageModal(idx + 1)}>
                    <img src={resolveListingImageUrl(image.imageUrl)} alt="" className="h-full w-full object-cover" />
                    {idx === 3 && listing.images.length > 5 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">Xem tất cả ({listing.images.length})</span>
                    )}
                  </button>
                ))}
                {(!listing.images || listing.images.length <= 1) && (
                  <div className="flex h-20 min-w-[11rem] items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-400">
                    Chưa có thêm ảnh
                  </div>
                )}
              </div>
            </section>

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
              <div className="space-y-6">
                <section className="flex flex-wrap gap-2">
                  {listing.promoExpiresAt && new Date(listing.promoExpiresAt) > new Date() && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
                      <Sparkles className="h-3.5 w-3.5" />
                      {listing.promoType === "premium" ? "TIN VIP CAO CẤP" : "TIN VIP NỔI BẬT"}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-700">Phòng riêng</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">Sẵn sàng ngay</span>
                </section>

                <section className="rounded-[24px] bg-white px-5 py-6 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.18)] border border-slate-200">
                  <h1 className="text-3xl md:text-[34px] font-extrabold leading-[1.1] text-slate-900 max-w-[850px]">{listing.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <MapPinned className="h-4 w-4 text-[#a55b00]" />
                    <span>{listingAddress || "Chưa cập nhật"}</span>
                  </div>
                  <div className="mt-4 text-2xl md:text-[30px] font-extrabold text-[#a55b00]">
                    {listing.rentPrice.toLocaleString("vi-VN")} <span className="text-base font-semibold text-slate-500">/ tháng</span>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="text-base font-bold text-slate-900">Mô tả chi tiết</h3>
                    <div className="mt-3 text-[15px] leading-7 text-slate-600 whitespace-pre-wrap">{renderDescription(listing.description)}</div>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["Mã tin đăng", `#${listing.id.slice(0, 8).toUpperCase()}`],
                        ["Quận/Huyện", listing.district || "—"],
                        ["Khu vực", listing.ward || "—"],
                        ["Diện tích", listing.roomAreaSqm ? `${listing.roomAreaSqm} m²` : "—"],
                        ["Loại phòng", listing.roomType || "Phòng trọ ở ghép"],
                        ["Đối tượng ưu tiên", listing.preferredGender || "Không yêu cầu"],
                        ["Cập nhật", formatDate(listing.updatedAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                          <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!listing.source && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${listing.smokingAllowed ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                        {listing.smokingAllowed ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                        {listing.smokingAllowed ? "Cho phép hút thuốc" : "Không hút thuốc"}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${listing.petAllowed ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                        {listing.petAllowed ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}
                        {listing.petAllowed ? "Nuôi thú cưng" : "Không nuôi thú cưng"}
                      </span>
                    </div>
                  )}

                  {listing.amenities && listing.amenities.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <h3 className="text-base font-bold text-slate-900">Tiện nghi</h3>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {listing.amenities.map((amenity) => (
                          <span key={amenity.id} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                            <CircleCheck className="h-4 w-4 text-[#a55b00] flex-shrink-0" />
                            {amenity.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h3 className="text-base font-bold text-slate-900">Vị trí</h3>
                      <button onClick={openMapModal} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        <ExternalLink className="h-3.5 w-3.5 text-[#a55b00]" /> Chỉ đường Google Maps
                      </button>
                    </div>
                    <div className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.78),rgba(255,255,255,0.18)_28%,rgba(17,24,39,0.62)_100%)] pointer-events-none" />
                      <iframe
                        title="Google Maps"
                        width="100%"
                        height="330"
                        style={{ border: 0 }}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(listingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        allowFullScreen
                        className="relative"
                      />
                    </div>
                  </div>

                  <div className="mx-0 mt-6 rounded-[18px] border border-[#edd7be] bg-[#fff6eb] p-4 text-left text-xs space-y-1.5 text-[#9a6a3c] leading-relaxed">
                    <p className="inline-flex w-full items-center justify-center gap-1.5 font-bold text-[#8d4d08] text-center">
                      <Info className="h-4 w-4 text-[#a55b00]" /> Lưu ý quan trọng:
                    </p>
                    <p>• Chỉ đặt cọc giữ chỗ khi đã xác thực danh tính chủ nhà và có thỏa thuận biên nhận rõ ràng.</p>
                    <p>• Kiểm tra kỹ điều khoản hợp đồng trước khi thực hiện ký kết.</p>
                  </div>
                </section>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-6">
                {listing.source ? (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.14)] text-center space-y-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Thông tin liên hệ</span>
                      <p className="text-sm text-slate-600">Thông tin liên hệ được quản lý tại bài đăng gốc.</p>
                    </div>
                    <a href={listing.source} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b63ff] hover:bg-[#0058eb] text-white py-3 text-sm font-bold transition">
                      <ExternalLink className="h-4 w-4" /> Xem bài đăng gốc
                    </a>
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.16)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#d38f5d] bg-[#f6efe9] text-lg font-semibold text-[#a55b00]">
                        {listing.ownerName?.slice(0, 1).toUpperCase() || "C"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-semibold text-slate-900">{listing.ownerName || "Chủ phòng trọ"}</h4>
                        <p className="text-xs text-emerald-600">Đã xác thực danh tính</p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 space-y-2">
                      <div>Thành viên từ: {formatDate(listing.ownerCreatedAt)}</div>
                      <div>Phản hồi: {activeLabel}</div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <button onClick={() => listing?.ownerPhone && handleCopyPhone(listing.ownerPhone)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a55b00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f4f00]">
                        <Phone className="h-4 w-4" /> {listing?.ownerPhone || "Chưa có SĐT"}
                        <span className="ml-1">{copiedPhone === listing?.ownerPhone ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</span>
                      </button>
                      {listing?.ownerPhone && (
                        <a href={`https://zalo.me/${listing.ownerPhone}`} target="_blank" rel="noopener noreferrer" onClick={handleZaloClick} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b63ff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0058eb]">
                          <MessageCircle className="h-4 w-4" /> Liên hệ qua Zalo
                        </a>
                      )}
                      {listing?.ownerPhone && (
                        <a href={`mailto:?subject=Thông tin phòng: ${listing.title}&body=Xem chi tiết tại: ${window.location.href}`} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                          <Send className="h-4 w-4" /> Gửi Email
                        </a>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button onClick={handleToggleSave} disabled={saving} className={`flex-1 rounded-2xl border px-3 py-2.5 text-xs font-semibold transition ${isSaved ? "border-[#a55b00] bg-[#a55b00]/5 text-[#a55b00]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        <span className="inline-flex items-center justify-center gap-1.5">
                          {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />} {isSaved ? "Đã lưu" : "Lưu tin"}
                        </span>
                      </button>
                      <button onClick={() => setShowShareModal(true)} className="flex-1 rounded-2xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        <span className="inline-flex items-center justify-center gap-1.5">
                          <Share2 className="h-3.5 w-3.5" /> {shareCopied ? "Đã copy" : "Chia sẻ"}
                        </span>
                      </button>
                    </div>

                    <button onClick={() => { setReportReason(""); setReportDescription(""); setReportName(""); setReportPhone(""); setReportSuccess(false); setShowReportModal(true); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                      <Flag className="h-4 w-4" /> Báo cáo
                    </button>
                  </div>
                )}

                {softFilterResult && (
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.14)] space-y-4">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Điểm khớp</div>
                      <div className="mt-1 text-3xl font-extrabold text-[#a55b00]">{Math.round(softFilterResult.total_score)}/100</div>
                    </div>
                    {getPrefsFromResult(softFilterResult).good.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-slate-700 mb-2">Điểm tốt</div>
                        <div className="space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                          {getPrefsFromResult(softFilterResult).good.map((p: any) => (
                            <div key={p.field} className="text-xs">
                              <div className="font-semibold text-slate-800">{FIELD_FULL_LABELS[p.field] || p.field}</div>
                              <div className="text-slate-500">Họ: <span className="text-slate-700">{p.profileLabel}</span> · Bạn: <span className="text-slate-700">{p.prefLabel}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {getPrefsFromResult(softFilterResult).caution.length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-slate-700 mb-2">Cần lưu ý</div>
                        <div className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50 p-3">
                          {getPrefsFromResult(softFilterResult).caution.map((p: any) => (
                            <div key={p.field} className="text-xs">
                              <div className="font-semibold text-slate-800">{FIELD_FULL_LABELS[p.field] || p.field}</div>
                              <div className="text-slate-500">Họ: <span className="text-slate-700">{p.profileLabel}</span> · Bạn: <span className="text-slate-700">{p.prefLabel}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-[24px] border border-[#edd7be] bg-[#fff6eb] p-4 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.12)]">
                  <p className="text-xs font-bold text-[#8d4d08] flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#a55b00]" /> Mẹo an toàn
                  </p>
                  <p className="text-xs leading-5 text-[#9a6a3c]">Không chuyển khoản đặt cọc khi chưa xem phòng trực tiếp và xác nhận thông tin chủ nhà.</p>
                </div>
              </aside>
            </div>

            <section className="mt-8 rounded-[24px] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.14)]">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Phòng tương tự trong khu vực</h3>
              {similarListings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {similarListings.map((item) => {
                    const thumbnail = resolveListingImageUrl(item.images?.[0]?.imageUrl || "");
                    const location = [item.ward, item.district, item.city].filter(Boolean).join(", ");
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/listings/${item.id}`)}
                        className="group overflow-hidden rounded-[18px] border border-slate-200 bg-white text-left shadow-[0_16px_32px_-28px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 hover:shadow-[0_24px_42px_-25px_rgba(0,0,0,0.3)]"
                      >
                        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                          {thumbnail ? (
                            <img src={thumbnail} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>
                          )}
                          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#a55b00] shadow-sm">
                            {item.rentPrice.toLocaleString("vi-VN")} / tháng
                          </span>
                        </div>
                        <div className="p-4">
                          <h4 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-[#a55b00]">{item.title}</h4>
                          <p className="mt-2 line-clamp-1 text-xs text-slate-500">{location || "Chưa cập nhật địa chỉ"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Tính năng đang được phát triển.</p>
              )}
            </section>
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-8" onClick={() => setShowShareModal(false)}>
          <div className="relative w-full max-w-[560px] rounded-[24px] bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowShareModal(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-lg">×</button>

            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Share2 className="h-5 w-5 text-blue-500" /> Chia sẻ bài đăng</h2>
            <p className="text-sm text-slate-600 mt-3">Sao chép đường dẫn hoặc chia sẻ tới ứng dụng khác.</p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <input readOnly value={window.location.href} className="flex-1 bg-transparent text-sm text-slate-600 outline-none truncate px-2" />
              <button onClick={async () => { await handleCopyLink(); }} className="flex-shrink-0 rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold transition flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {shareCopied ? "Đã copy" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
