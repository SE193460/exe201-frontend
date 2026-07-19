import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, ChevronRight, CircleCheck, CircleX, Edit3, ExternalLink, Home, Info, MapPinned, Rocket, Send, ShieldCheck, XCircle } from "lucide-react";
import { getMyListingDetail, resolveListingImageUrl, submitMyListingForApproval } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import UserShell from "../layouts/UserShell";

function formatDate(value: string | null | undefined) {
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
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-orange-600 underline font-semibold hover:text-orange-700 break-all">{part}</a>
      );
    }
    return part;
  });
}

export default function ListingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTab, setMediaModalTab] = useState<"images" | "map">("images");

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
      .then((data) => { setListing(data); setLoading(false); })
      .catch(() => { setError("Không thể tải chi tiết bài đăng."); setLoading(false); });
  }, [id]);

  const handlePrevImg = () => {
    if (!listing?.images?.length) return;
    setSelectedImgIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImg = () => {
    if (!listing?.images?.length) return;
    setSelectedImgIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  const listingAddress = listing?.address || [listing?.ward, listing?.district, listing?.city].filter(Boolean).join(", ");

  useEffect(() => {
    if (!isMediaModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMediaModalOpen(false);
      if (mediaModalTab !== "images") return;
      if (event.key === "ArrowLeft") handlePrevImg();
      if (event.key === "ArrowRight") handleNextImg();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = originalOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [isMediaModalOpen, mediaModalTab, listing]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return { text: "Bản nháp", cls: "bg-slate-100 text-slate-700 border border-slate-200" };
      case "PENDING": return { text: "Chờ duyệt", cls: "bg-amber-50 text-amber-700 border border-amber-200" };
      case "APPROVED": return { text: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
      case "REJECTED": return { text: "Từ chối", cls: "bg-red-50 text-red-600 border border-red-200" };
      default: return { text: status, cls: "bg-slate-100 text-slate-600 border border-slate-200" };
    }
  };

  return (
    <UserShell>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6 py-3">
            <nav className="flex items-center gap-2 text-xs text-slate-500">
              <button onClick={() => navigate("/my-listings")} className="flex items-center gap-1 hover:text-[#a55b00] transition">
                <Home className="h-3.5 w-3.5" /> Bài đăng của tôi
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="max-w-[260px] truncate font-medium text-slate-800">{listing?.title || "..."}</span>
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
            <section className="space-y-3 mb-8">
              <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] cursor-pointer" onClick={() => setIsMediaModalOpen(true)}>
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
                  <button key={image.id} className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-[16px] bg-slate-100 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.35)]" onClick={() => { setSelectedImgIdx(idx + 1); setIsMediaModalOpen(true); }}>
                    <img src={resolveListingImageUrl(image.imageUrl)} alt="" className="h-full w-full object-cover" />
                    {idx === 4 && listing.images.length > 5 && (
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

            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
              <div className="space-y-6">
                <section className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${statusBadge(listing.status).cls}`}>
                    {statusBadge(listing.status).text}
                  </span>
                  {listing.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-700">Đang chờ admin phê duyệt</span>
                  )}
                  {listing.status === "REJECTED" && listing.rejectionReason && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-[11px] font-semibold text-red-600">Bị từ chối</span>
                  )}
                </section>

                {listing.status === "REJECTED" && listing.rejectionReason && (
                  <div className="rounded-[18px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <strong>Lý do từ chối:</strong> {listing.rejectionReason}
                  </div>
                )}

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
                      <a href={`https://maps.google.com/maps?q=${encodeURIComponent(listingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                        <ExternalLink className="h-3.5 w-3.5 text-[#a55b00]" /> Chỉ đường Google Maps
                      </a>
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
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.16)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#d38f5d] bg-[#f6efe9] text-lg font-semibold text-[#a55b00]">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-base font-bold text-slate-900">Quản lý bài đăng</h4>
                      <p className="text-xs text-slate-500">Mã: #{listing.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 space-y-1.5 mb-4">
                    <div className="flex justify-between"><span>Trạng thái:</span><strong className="text-slate-800">{statusBadge(listing.status).text}</strong></div>
                    <div className="flex justify-between"><span>Cập nhật:</span><strong className="text-slate-800">{formatDate(listing.updatedAt)}</strong></div>
                    {listing.promoExpiresAt && new Date(listing.promoExpiresAt) > new Date() && (
                      <div className="flex justify-between"><span>VIP hết hạn:</span><strong className="text-[#a55b00]">{formatDate(listing.promoExpiresAt)}</strong></div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(listing.status === "DRAFT" || listing.status === "REJECTED") && (
                      <button
                        disabled={submitting}
                        onClick={handleSubmitForApproval}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#a55b00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f4f00] disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? "Đang gửi..." : "Gửi duyệt"}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/my-listings/${id}/edit`)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" /> Chỉnh sửa
                    </button>
                    {listing.status === "APPROVED" && (
                      <button
                        onClick={() => navigate(`/payment/${listing.id}`)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
                      >
                        <Rocket className="h-4 w-4" /> Đẩy tin VIP
                      </button>
                    )}
                    <button
                      onClick={() => navigate("/my-listings")}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      <XCircle className="h-4 w-4" /> Quay lại danh sách
                    </button>
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#edd7be] bg-[#fff6eb] p-4 shadow-[0_18px_45px_-35px_rgba(0,0,0,0.12)]">
                  <p className="text-xs font-bold text-[#8d4d08] flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#a55b00]" /> Mẹo quản lý
                  </p>
                  <p className="text-xs leading-5 text-[#9a6a3c]">Bài đăng đã duyệt sẽ hiển thị công khai. Bạn có thể đẩy tin VIP để tăng lượt xem.</p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {isMediaModalOpen && listing && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm px-4 py-6 md:px-8" onClick={() => setIsMediaModalOpen(false)}>
          <div className="mx-auto flex h-full w-full max-w-[1220px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="w-20"></div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-800 p-1">
                <button onClick={() => setMediaModalTab("images")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mediaModalTab === "images" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>Hình ảnh</button>
                <button onClick={() => setMediaModalTab("map")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${mediaModalTab === "map" ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`}>Bản đồ</button>
              </div>
              <button onClick={() => setIsMediaModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xl text-white transition hover:bg-slate-700">×</button>
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
                        <button key={image.id} onClick={() => setSelectedImgIdx(idx)} className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${selectedImgIdx === idx ? "border-orange-500" : "border-transparent opacity-70 hover:opacity-100"}`}>
                          <img src={resolveListingImageUrl(image.imageUrl)} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-hidden rounded-xl border border-slate-700">
                  <iframe title="Google Maps" width="100%" height="100%" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${encodeURIComponent(listingAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} allowFullScreen />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </UserShell>
  );
}
