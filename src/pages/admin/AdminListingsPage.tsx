import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminListings, approveListing, rejectListing, type AdminListing } from "../../api/services/admin";
import { resolveListingImageUrl } from "../../api/services/listings";
import { logout } from "../../api/services/auth";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";

export default function AdminListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [selected, setSelected] = useState<AdminListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [listPage, setListPage] = useState(1);
  const LIST_PAGE_SIZE = 10;

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminListings();
      setListings(data);
      if (selected) {
        const updated = data.find((item) => item.id === selected.id);
        if (updated) setSelected(updated);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadListings(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await approveListing(id);
      await loadListings();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !reason.trim()) return;
    setActionLoading(true);
    try {
      await rejectListing(selected.id, reason);
      setRejecting(false);
      setReason("");
      await loadListings();
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } finally {
      localStorage.removeItem("access_token");
      navigate("/");
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const listTotalPages = Math.ceil(filteredListings.length / LIST_PAGE_SIZE);
  const pagedListings = filteredListings.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  const getStatusLabel = (status: string) => {
    switch (status) {
      
      case "PENDING":  return { text: "Chờ duyệt", className: "bg-amber-100 text-amber-700 font-bold border border-amber-200 animate-pulse" };
      case "APPROVED": return { text: "Đã duyệt",  className: "bg-green-100 text-green-700" };
      case "REJECTED": return { text: "Từ chối",   className: "bg-red-100 text-red-700" };
      default:         return { text: status,       className: "bg-slate-100 text-slate-700" };
    }
  };

  const countByStatus = (s: string) => listings.filter((l) => l.status === s).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="listings" onLogout={handleLogout} />

        <main className="flex-1 min-w-0 space-y-6">
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">Bảng điều khiển</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Quản lý bài đăng</h1>
              <p className="mt-1 text-sm text-slate-500">Duyệt bài đăng phòng ở ghép và phòng cho thuê.</p>
            </div>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setListPage(1); }}
              className="w-full max-w-md rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--primary)]" placeholder="Tìm kiếm tiêu đề, mô tả bài đăng..." />
          </section>

          <div className="flex flex-wrap gap-2">
            {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
              <button key={s} onClick={() => { setFilterStatus(s); setListPage(1); }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition ${filterStatus === s ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {s === "all" ? `Tất cả (${listings.length})` : s === "PENDING" ? `Chờ duyệt (${countByStatus("PENDING")})` : s === "APPROVED" ? `Đã duyệt (${countByStatus("APPROVED")})` : `Từ chối (${countByStatus("REJECTED")})`}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:gap-6 items-start">
            <div className="w-full md:w-[340px] flex-shrink-0 rounded-lg border border-slate-200 bg-white flex flex-col" style={{ maxHeight: "calc(100vh - 260px)" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700">Danh sách ({filteredListings.length})</h2>
                {loading && <span className="text-xs text-slate-400">Đang tải...</span>}
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {filteredListings.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">Không tìm thấy bài đăng nào.</p>
                ) : pagedListings.map((listing) => {
                  const badge = getStatusLabel(listing.status);
                  return (
                    <button key={listing.id} onClick={() => { setSelected(listing); setRejecting(false); setSelectedImgIdx(0); }}
                      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition ${selected?.id === listing.id ? "border-[var(--primary)] bg-orange-50/50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                      <div className="h-12 w-14 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                        {listing.images && listing.images.length > 0
                          ? <img src={resolveListingImageUrl(listing.images[0].imageUrl)} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full w-full items-center justify-center text-lg">🏠</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{listing.title}</p>
                        <p className="mt-1 text-[11px] font-bold text-[var(--primary)]">{listing.rentPrice.toLocaleString("vi-VN")} đ</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${badge.className}`}>{badge.text}</span>
                          <span className="text-[9px] text-slate-400">{new Date(listing.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {listTotalPages > 1 && (
                <div className="px-3 pb-3 border-t border-slate-100 pt-2">
                  <Pagination currentPage={listPage} totalPages={listTotalPages} onPageChange={setListPage} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
              {!selected ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center text-slate-400">
                    <p className="text-4xl mb-3">📋</p>
                    <p className="text-sm font-semibold">Chọn một bài đăng để xem chi tiết</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getStatusLabel(selected.status).className}`}>{getStatusLabel(selected.status).text}</span>
                        <span className="text-xs text-slate-400">#{selected.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-800 leading-snug">{selected.title}</h2>
                      <p className="mt-1 text-sm font-bold text-[var(--primary)]">{selected.rentPrice.toLocaleString("vi-VN")} đ / tháng</p>
                    </div>
                    {!rejecting && (
                      <div className="flex gap-2 flex-shrink-0">
                        {selected.status === "PENDING" && (
                          <button onClick={() => handleApprove(selected.id)} disabled={actionLoading}
                            className="rounded-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-50 transition">{actionLoading ? "Đang duyệt..." : "✓ Phê duyệt"}</button>
                        )}
                        {(selected.status === "PENDING" || selected.status === "APPROVED") && (
                          <button onClick={() => setRejecting(true)} disabled={actionLoading}
                            className="rounded-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-bold disabled:opacity-50 transition">✕ Từ chối</button>
                        )}
                      </div>
                    )}
                  </div>

                  {rejecting && (
                    <form onSubmit={handleReject} className="rounded-lg border border-red-200 bg-red-50/40 p-4 space-y-3">
                      <label className="block text-xs font-bold text-red-600 uppercase tracking-wide">Lý do từ chối</label>
                      <textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vui lòng nhập lý do từ chối duyệt bài..." className="w-full rounded-lg border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-400" rows={3} />
                      <div className="flex gap-2">
                        <button type="submit" disabled={actionLoading} className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white py-2 text-sm font-bold disabled:opacity-50 transition">{actionLoading ? "Đang gửi..." : "Xác nhận từ chối"}</button>
                        <button type="button" onClick={() => setRejecting(false)} className="flex-1 rounded-full border border-slate-200 bg-white text-slate-700 py-2 text-sm font-bold hover:bg-slate-50 transition">Hủy bỏ</button>
                      </div>
                    </form>
                  )}

                  {selected.images && selected.images.length > 0 ? (
                    <div className="space-y-3">
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                        <img src={resolveListingImageUrl(selected.images[selectedImgIdx].imageUrl)} alt={selected.title} className="h-full w-full object-cover" />
                        {selected.images.length > 1 && (
                          <>
                            <button onClick={() => setSelectedImgIdx(i => i === 0 ? selected.images.length - 1 : i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition text-lg font-bold">‹</button>
                            <button onClick={() => setSelectedImgIdx(i => i === selected.images.length - 1 ? 0 : i + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 transition text-lg font-bold">›</button>
                            <span className="absolute bottom-3 right-3 rounded-md bg-black/60 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white">{selectedImgIdx + 1} / {selected.images.length}</span>
                          </>
                        )}
                      </div>
                      {selected.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {selected.images.map((img, idx) => (
                            <button key={img.id} onClick={() => setSelectedImgIdx(idx)} className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition ${selectedImgIdx === idx ? "border-[var(--primary)]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                              <img src={resolveListingImageUrl(img.imageUrl)} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">Bài đăng không đính kèm hình ảnh</div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { label: "Loại phòng", value: selected.roomType || "Chưa rõ" },
                      { label: "Diện tích", value: selected.roomAreaSqm ? `${selected.roomAreaSqm} m²` : "Chưa rõ" },
                      { label: "Giới tính ưu tiên", value: selected.preferredGender || "Mọi giới tính" },
                      { label: "Sức chứa", value: `${selected.currentOccupants ?? 0} / ${selected.maxOccupants ?? 0} người` },
                      { label: "Hút thuốc", value: selected.smokingAllowed ? "Cho phép" : "Không cho phép" },
                      { label: "Thú cưng", value: selected.petAllowed ? "Cho phép" : "Không cho phép" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {selected.amenities && selected.amenities.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                      <h3 className="text-sm font-bold text-slate-700">Tiện nghi</h3>
                      <div className="flex flex-wrap gap-2">
                        {selected.amenities.map((a) => (
                          <span key={a.id} className="rounded-full bg-[var(--primary-container)] border border-orange-200 px-3 py-1 text-xs font-bold text-[var(--primary)]">✓ {a.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-700">Địa điểm</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      {[{ label: "Tỉnh/Thành phố", value: selected.city }, { label: "Quận/Huyện", value: selected.district }, { label: "Phường/Xã", value: selected.ward }, { label: "Địa chỉ cụ thể", value: selected.address }].map(({ label, value }) => (
                        <div key={label} className="flex justify-between border-b border-slate-50 py-1">
                          <span className="text-slate-400">{label}:</span>
                          <strong className="text-slate-700 text-right">{value || "Chưa cập nhật"}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-700">Thời gian</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                      {[
                        { label: "Ngày tạo", value: new Date(selected.createdAt).toLocaleDateString("vi-VN") },
                        { label: "Cập nhật", value: new Date(selected.updatedAt).toLocaleDateString("vi-VN") },
                        { label: "Có thể vào từ", value: selected.availableFrom ? new Date(selected.availableFrom).toLocaleDateString("vi-VN") : null },
                        { label: "Đăng lên", value: selected.publishedAt ? new Date(selected.publishedAt).toLocaleDateString("vi-VN") : null },
                        { label: "Hết hạn", value: selected.expiresAt ? new Date(selected.expiresAt).toLocaleDateString("vi-VN") : null },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between border-b border-slate-50 py-1">
                          <span className="text-slate-400">{label}:</span>
                          <strong className="text-slate-700">{value || "—"}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                    <h3 className="text-sm font-bold text-slate-700">Mô tả</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                  </div>

                  {(selected.ownerName || selected.ownerEmail) && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
                      <h3 className="text-sm font-bold text-slate-700">Thông tin chủ phòng</h3>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[var(--primary-container)] border border-orange-200 flex items-center justify-center text-base font-bold text-[var(--primary)]">{selected.ownerName?.slice(0, 1).toUpperCase() || "?"}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{selected.ownerName || "Chưa rõ"}</p>
                          <p className="text-xs text-slate-400">{selected.ownerEmail || ""}</p>
                          {selected.ownerPhone && <p className="text-xs text-slate-500">📞 {selected.ownerPhone}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {selected.rejectionReason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1">Lý do từ chối trước đó</p>
                      <p className="text-sm text-red-700">{selected.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}