import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchImportedListings,
  createImportedListing,
  updateImportedListing,
  publishImportedListing,
  unpublishImportedListing,
  addImportedListingImageUrls,
  type ImportedListing,
  type CreateImportedListingPayload,
} from "../../api/services/admin";
import { fetchAmenities, type Amenity } from "../../api/services/amenities";
import { resolveListingImageUrl } from "../../api/services/listings";
import { logout } from "../../api/services/auth";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "../listingFormOptions";
import Pagination from "../../components/Pagination";

type FormMode = "create" | "edit";

const emptyForm = () => ({
  title: "",
  description: "",
  rentPrice: "",
  city: CITY_OPTIONS[0] || "",
  district: DISTRICT_OPTIONS[0] || "",
  ward: WARD_OPTIONS[DISTRICT_OPTIONS[0]]?.[0] || "",
  address: "",
  availableFrom: "",
  preferredGender: "",
  roomType: "",
  roomAreaSqm: "",
  maxOccupants: "",
  currentOccupants: "0",
  smokingAllowed: false,
  petAllowed: false,
  source: "",
  imageUrls: "",
});

const STATUS_LABELS: Record<string, { text: string; cls: string }> = {
  DRAFT:    { text: "Bản nháp",  cls: "bg-slate-100 text-slate-600 border border-slate-200" },
  PENDING:  { text: "Chờ duyệt", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
  APPROVED: { text: "Đã đăng",   cls: "bg-green-100 text-green-700 border border-green-200" },
  REJECTED: { text: "Từ chối",   cls: "bg-red-100 text-red-700 border border-red-200" },
};

export default function AdminImportedListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<ImportedListing[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchImportedListings();
      setListings(data);
    } catch {
      setError("Không thể tải danh sách bài đăng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetchAmenities().then(setAmenities).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally {
      localStorage.removeItem("access_token");
      navigate("/");
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm());
    setSelectedAmenityIds([]);
    setFormError("");
    setFormMode("create");
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (listing: ImportedListing) => {
    setForm({
      title: listing.title,
      description: listing.description,
      rentPrice: String(listing.rentPrice),
      city: listing.city || CITY_OPTIONS[0],
      district: listing.district,
      ward: listing.ward || "",
      address: listing.address || "",
      availableFrom: listing.availableFrom ? listing.availableFrom.slice(0, 10) : "",
      preferredGender: listing.preferredGender || "",
      roomType: listing.roomType || "",
      roomAreaSqm: listing.roomAreaSqm ? String(listing.roomAreaSqm) : "",
      maxOccupants: listing.maxOccupants ? String(listing.maxOccupants) : "",
      currentOccupants: String(listing.currentOccupants ?? 0),
      smokingAllowed: listing.smokingAllowed,
      petAllowed: listing.petAllowed,
      source: listing.source || "",
      imageUrls: (listing.images || []).map((img) => img.imageUrl).filter((u) => u.startsWith("http://") || u.startsWith("https://")).join("\n"),
    });
    setSelectedAmenityIds((listing.amenities || []).map((a) => a.id));
    setFormError("");
    setFormMode("edit");
    setEditingId(listing.id);
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.title || !form.description || !form.rentPrice || !form.district || !form.source) {
      setFormError("Vui lòng điền đầy đủ tiêu đề, mô tả, giá, quận/huyện và link nguồn.");
      return;
    }
    const rentPrice = Number(form.rentPrice);
    if (Number.isNaN(rentPrice) || rentPrice <= 0) {
      setFormError("Giá thuê không hợp lệ.");
      return;
    }
    if (!form.source.startsWith("http://") && !form.source.startsWith("https://")) {
      setFormError("Link nguồn phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    const urlLines = form.imageUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

    const payload: CreateImportedListingPayload = {
      title: form.title,
      description: form.description,
      rentPrice,
      city: form.city,
      district: form.district,
      ward: form.ward,
      address: form.address || null,
      availableFrom: form.availableFrom || null,
      preferredGender: form.preferredGender || null,
      roomType: form.roomType || null,
      roomAreaSqm: form.roomAreaSqm ? Number(form.roomAreaSqm) : null,
      maxOccupants: form.maxOccupants ? Number(form.maxOccupants) : null,
      currentOccupants: form.currentOccupants ? Number(form.currentOccupants) : 0,
      smokingAllowed: form.smokingAllowed,
      petAllowed: form.petAllowed,
      source: form.source,
      amenityIds: selectedAmenityIds,
      imageUrls: formMode === "create" ? urlLines : undefined,
    };

    setActionLoading(true);
    try {
      if (formMode === "create") {
        await createImportedListing(payload);
      } else if (editingId) {
        await updateImportedListing(editingId, payload);
        // Add new image URLs if entered in edit mode
        if (urlLines.length > 0) {
          await addImportedListingImageUrls(editingId, urlLines);
        }
      }
      setShowForm(false);
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || "Không thể lưu bài đăng.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading(true);
    try {
      await publishImportedListing(id);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (id: string) => {
    setActionLoading(true);
    try {
      await unpublishImportedListing(id);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = listings.filter((l) =>
    `${l.title} ${l.source}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              <button onClick={() => navigate("/home")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Trang chủ</button>
              <button onClick={() => navigate("/admin/dashboard")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Dashboard</button>
              <button onClick={() => navigate("/admin/users")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Quản lý người dùng</button>
              <button onClick={() => navigate("/admin/listings")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Quản lý bài đăng</button>
              <button className="w-full rounded-full bg-orange-100 px-4 py-2 text-left text-orange-700">Quản lý nguồn bài đăng</button>
              <button onClick={() => navigate("/admin/amenities")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Quản lý tiện nghi</button>
              <button onClick={() => navigate("/admin/payments")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Quản lý thanh toán</button>
              <button onClick={() => navigate("/admin/reports")} className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50">Quản lý báo cáo</button>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50">Đăng xuất</button>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-6">

          {/* Header */}
          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-500">Bảng điều khiển</p>
                <h1 className="text-2xl font-bold">Quản lý nguồn bài đăng</h1>
                <p className="mt-1 text-sm text-slate-500">Import và quản lý bài đăng từ các nền tảng bên ngoài.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full max-w-xs rounded-full border border-orange-100 px-4 py-2 text-sm outline-none focus:border-orange-300"
                  placeholder="Tìm kiếm tiêu đề, link nguồn..."
                />
                <button
                  onClick={openCreate}
                  className="shrink-0 rounded-full bg-[#ff6a3d] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 hover:bg-[#e65a2f] transition"
                >
                  + Thêm bài đăng
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Form overlay */}
          {showForm && (
            <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">
                  {formMode === "create" ? "Thêm bài đăng từ nguồn bên ngoài" : "Chỉnh sửa bài đăng"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>

              {formError && (
                <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">⚠ {formError}</p>
              )}

              <form onSubmit={handleSubmitForm} className="grid gap-4 md:grid-cols-2">
                {/* Source URL — top priority */}
                <div className="md:col-span-2 rounded-[20px] border border-blue-100 bg-blue-50/30 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-500 mb-3">🔗 Nguồn bài đăng</h3>
                  <label className="block text-sm font-medium text-slate-700">
                    Link bài đăng gốc <span className="text-red-400">*</span>
                    <input
                      type="url"
                      value={form.source}
                      onChange={(e) => handleChange("source", e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300"
                      placeholder="https://nhatot.com/..."
                    />
                    <p className="mt-1 text-xs text-slate-400">Link gốc được lưu để đảm bảo tính minh bạch pháp lý.</p>
                  </label>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    URLs hình ảnh từ nguồn gốc
                    <textarea
                      rows={3}
                      value={form.imageUrls}
                      onChange={(e) => handleChange("imageUrls", e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-blue-300"
                      placeholder={"https://cdn.example.com/img1.jpg\nhttps://cdn.example.com/img2.jpg"}
                    />
                    <p className="mt-1 text-xs text-slate-400">Mỗi URL một dòng. Ảnh tham chiếu trực tiếp, không tải về server.</p>
                  </label>
                </div>

                <label className="block md:col-span-2 text-sm font-medium text-slate-700">
                  Tiêu đề <span className="text-red-400">*</span>
                  <input type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
                    placeholder="Phòng trọ đầy đủ tiện nghi" />
                </label>

                <label className="block md:col-span-2 text-sm font-medium text-slate-700">
                  Mô tả <span className="text-red-400">*</span>
                  <textarea rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
                    placeholder="Mô tả chi tiết..." />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Giá thuê (VND) <span className="text-red-400">*</span>
                  <input type="number" value={form.rentPrice} onChange={(e) => handleChange("rentPrice", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
                    placeholder="3000000" />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Diện tích (m²)
                  <input type="number" value={form.roomAreaSqm} onChange={(e) => handleChange("roomAreaSqm", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:border-orange-300" />
                </label>

                <div className="md:col-span-2 rounded-[20px] border border-orange-100 bg-orange-50/30 px-5 py-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-500 mb-3">Vị trí</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Tỉnh/Thành phố
                      <select value={form.city} onChange={(e) => handleChange("city", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none">
                        {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Quận/Huyện <span className="text-red-400">*</span>
                      <select value={form.district} onChange={(e) => handleChange("district", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none">
                        {DISTRICT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Phường/Xã
                      <select value={form.ward} onChange={(e) => handleChange("ward", e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none">
                        {(WARD_OPTIONS[form.district] || []).map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Địa chỉ cụ thể
                    <input type="text" value={form.address} onChange={(e) => handleChange("address", e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none" />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Loại phòng
                  <input type="text" value={form.roomType} onChange={(e) => handleChange("roomType", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="Phòng trọ / Căn hộ" />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Giới tính ưu tiên
                  <input type="text" value={form.preferredGender} onChange={(e) => handleChange("preferredGender", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="Nam / Nữ / Không yêu cầu" />
                </label>



                {amenities.length > 0 && (
                  <div className="md:col-span-2 rounded-[20px] border border-orange-100 bg-orange-50/30 px-5 py-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-500 mb-3">Tiện nghi</h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {amenities.map((a) => (
                        <label key={a.id} className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm text-slate-700">
                          <input type="checkbox"
                            checked={selectedAmenityIds.includes(a.id)}
                            onChange={() => setSelectedAmenityIds((prev) =>
                              prev.includes(a.id) ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                            )}
                            className="h-4 w-4"
                          />
                          {a.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" disabled={actionLoading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-50">
                    {actionLoading ? "Đang lưu..." : formMode === "create" ? "Lưu bản nháp" : "Cập nhật"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="rounded-2xl border border-orange-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-orange-50">
                    Hủy
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Listings table */}
          <section className="rounded-[24px] bg-white shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] overflow-hidden">
            <div className="px-6 py-4 border-b border-orange-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700">
                Danh sách bài đăng nguồn ngoài ({filtered.length})
              </h2>
              {loading && <span className="text-xs text-slate-400">Đang tải...</span>}
            </div>

            {filtered.length === 0 && !loading ? (
              <div className="py-16 text-center text-sm text-slate-400">
                Chưa có bài đăng nào từ nguồn bên ngoài.
              </div>
            ) : (
              <div className="divide-y divide-orange-50">
                {paged.map((listing) => {
                  const thumb = listing.images?.[0]?.imageUrl
                    ? resolveListingImageUrl(listing.images[0].imageUrl)
                    : null;
                  const badge = STATUS_LABELS[listing.status] || { text: listing.status, cls: "bg-slate-100 text-slate-600" };
                  let sourceDomain = "";
                  try { sourceDomain = new URL(listing.source || "").hostname; } catch { sourceDomain = listing.source || ""; }

                  return (
                    <div key={listing.id} className="flex items-center gap-4 px-6 py-4 hover:bg-orange-50/40 transition">
                      <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-orange-100 bg-orange-50">
                        {thumb
                          ? <img src={thumb} alt="" className="h-full w-full object-cover" />
                          : <div className="flex h-full w-full items-center justify-center text-lg">🏠</div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{listing.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{listing.rentPrice.toLocaleString("vi-VN")} đ/tháng · {listing.district}</p>
                        <a href={listing.source || ""} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-blue-500 hover:underline mt-0.5 block truncate">
                          🔗 {sourceDomain}
                        </a>
                      </div>

                      <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${badge.cls}`}>
                        {badge.text}
                      </span>

                      <div className="flex shrink-0 items-center gap-2">
                        <button onClick={() => openEdit(listing)}
                          className="rounded-full border border-orange-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-orange-50 transition">
                          Sửa
                        </button>
                        {listing.status !== "APPROVED" ? (
                          <button onClick={() => handlePublish(listing.id)} disabled={actionLoading}
                            className="rounded-full bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition">
                            ↑ Đăng
                          </button>
                        ) : (
                          <button onClick={() => handleUnpublish(listing.id)} disabled={actionLoading}
                            className="rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition">
                            ↓ Gỡ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-6 pb-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
