import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAdminListings, approveListing, rejectListing, type AdminListing } from "../../api/services/admin";
import { resolveListingImageUrl } from "../../api/services/listings";
import { logout } from "../../api/services/auth";

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

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminListings();
      setListings(data);
      if (selected) {
        const updated = data.find((item) => item.id === selected.id);
        if (updated) {
          setSelected(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

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
    try {
      await logout();
    } finally {
      localStorage.removeItem("access_token");
      navigate("/");
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = `${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "DRAFT":
        return { text: "Bản nháp", className: "bg-slate-100 text-slate-700" };
      case "PENDING":
        return { text: "Chờ duyệt", className: "bg-amber-100 text-amber-700 font-bold border border-amber-250 animate-pulse" };
      case "APPROVED":
        return { text: "Đã duyệt", className: "bg-green-100 text-green-700" };
      case "REJECTED":
        return { text: "Từ chối", className: "bg-red-100 text-red-700" };
      default:
        return { text: status, className: "bg-slate-100 text-slate-700" };
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        {/* Sidebar */}
        <aside className="w-full max-w-[250px] rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6a3d] text-white">🏠</span>
              RoomMate Admin
            </div>
            <div className="mt-8 space-y-2 text-sm font-semibold">
              <button
                onClick={() => navigate("/home")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Trang chủ
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Quản lý người dùng
              </button>
              <button
                className="w-full rounded-full bg-orange-100 px-4 py-2 text-left text-orange-700"
              >
                Quản lý bài đăng
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50"
          >
            Đăng xuất
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Dashboard Header */}
          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-500">Bảng điều khiển</p>
                <h1 className="text-2xl font-bold">Quản lý bài đăng</h1>
                <p className="mt-1 text-sm text-slate-500">Duyệt bài đăng phòng ở ghép và phòng cho thuê.</p>
              </div>
              <div className="flex w-full max-w-md gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-orange-100 px-4 py-2 text-sm outline-none focus:border-orange-300"
                  placeholder="Tìm kiếm tiêu đề, mô tả bài đăng..."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["all", "PENDING", "APPROVED", "REJECTED", "DRAFT"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border ${
                    filterStatus === status
                      ? "bg-orange-150 border-orange-250 text-orange-700 font-bold"
                      : "border-orange-100 text-slate-500 hover:bg-orange-50"
                  }`}
                >
                  {status === "all" ? "Tất cả" : status === "PENDING" ? "Chờ duyệt" : status === "APPROVED" ? "Đã duyệt" : status === "REJECTED" ? "Từ chối" : "Bản nháp"}
                </button>
              ))}
            </div>
          </section>

          {/* List and Detail Split */}
          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            {/* List */}
            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Danh sách bài đăng</h2>
                {loading && <span className="text-xs text-slate-400">Đang tải...</span>}
              </div>

              <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredListings.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-10">Không tìm thấy bài đăng nào.</p>
                ) : (
                  filteredListings.map((listing) => {
                    const badge = getStatusLabel(listing.status);
                    return (
                      <button
                        key={listing.id}
                        onClick={() => {
                          setSelected(listing);
                          setRejecting(false);
                        }}
                        className={`flex w-full items-start justify-between rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                          selected?.id === listing.id
                            ? "border-orange-200 bg-orange-50"
                            : "border-orange-100 bg-white hover:bg-orange-50/60"
                        }`}
                      >
                        <div className="flex-1 pr-3">
                          <h3 className="font-bold text-slate-800 line-clamp-1">{listing.title}</h3>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{listing.description}</p>
                          <p className="mt-2 text-[11px] text-[#ff6a3d] font-bold">
                            Giá: {listing.rentPrice.toLocaleString("vi-VN")} VND
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end justify-between self-stretch">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-2">
                            {new Date(listing.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Detail */}
            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <h2 className="text-lg font-semibold text-slate-800">Chi tiết phê duyệt</h2>

              {selected ? (
                <div className="mt-4 space-y-4 text-sm">
                  {/* Thumbnail Carousel or List */}
                  {selected.images && selected.images.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                      {selected.images.map((img) => (
                        <div key={img.id} className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-orange-50 bg-orange-50">
                          <img src={resolveListingImageUrl(img.imageUrl)} alt="Listing" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-16 flex items-center justify-center rounded-lg border border-orange-50 bg-orange-50/40 text-xs text-slate-450 font-bold">
                      Bài đăng không kèm ảnh
                    </div>
                  )}

                  <div className="rounded-2xl bg-orange-50/70 p-4 space-y-2 border border-orange-100">
                    <p className="text-base font-bold text-slate-800">{selected.title}</p>
                    <p className="text-xs text-slate-600 line-clamp-4">{selected.description}</p>
                  </div>

                  <div className="rounded-xl border border-orange-100 p-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Loại phòng:</span>
                      <strong className="text-slate-700">{selected.roomType || "Chưa rõ"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Diện tích:</span>
                      <strong className="text-slate-700">{selected.roomAreaSqm ? `${selected.roomAreaSqm} m²` : "Chưa rõ"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Địa điểm:</span>
                      <strong className="text-slate-700 line-clamp-1">{[selected.district, selected.city].filter(Boolean).join(", ")}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Sức chứa:</span>
                      <strong className="text-slate-700">{selected.currentOccupants || 0}/{selected.maxOccupants || 0}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Ưu tiên:</span>
                      <strong className="text-slate-700">{selected.preferredGender || "Mọi giới tính"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Trạng thái:</span>
                      <span className={`rounded px-1.5 py-0.5 font-bold ${getStatusLabel(selected.status).className}`}>
                        {getStatusLabel(selected.status).text}
                      </span>
                    </div>
                    {selected.rejectionReason && (
                      <div className="mt-2 rounded bg-red-50 border border-red-100 p-2 text-red-700">
                        <strong>Lý do từ chối trước đó:</strong> {selected.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions for PENDING / REJECTING */}
                  {!rejecting ? (
                    <div className="flex gap-2">
                      {selected.status === "PENDING" && (
                        <button
                          onClick={() => handleApprove(selected.id)}
                          disabled={actionLoading}
                          className="flex-1 rounded-full bg-green-600 hover:bg-green-700 text-white py-2 text-sm font-bold shadow-sm disabled:opacity-50"
                        >
                          {actionLoading ? "Đang duyệt..." : "Phê duyệt"}
                        </button>
                      )}
                      {(selected.status === "PENDING" || selected.status === "APPROVED") && (
                        <button
                          onClick={() => setRejecting(true)}
                          disabled={actionLoading}
                          className="flex-1 rounded-full bg-red-500 hover:bg-red-650 text-white py-2 text-sm font-bold shadow-sm disabled:opacity-50"
                        >
                          Từ chối bài
                        </button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleReject} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">LÝ DO TỪ CHỐI DUYỆT</label>
                        <textarea
                          required
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Vui lòng nhập lý do từ chối duyệt bài..."
                          className="w-full rounded-2xl border border-red-200 bg-red-50/20 p-3 text-xs outline-none focus:border-red-400"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-bold shadow-sm disabled:opacity-50"
                        >
                          {actionLoading ? "Đang gửi từ chối..." : "Xác nhận từ chối"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejecting(false)}
                          className="flex-1 rounded-full border border-orange-200 text-slate-700 py-2 text-xs font-bold shadow-sm hover:bg-orange-50"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Chọn một bài đăng để xem chi tiết phê duyệt.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
