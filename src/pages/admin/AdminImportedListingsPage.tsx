import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchImportedListings,
  createImportedListing,
  updateImportedListing,
  publishImportedListing,
  unpublishImportedListing,
  addImportedListingImageUrls,
  deleteImportedListingImage,
  type ImportedListing,
  type CreateImportedListingPayload,
} from "../../api/services/admin";
import { fetchAmenities, type Amenity } from "../../api/services/amenities";
import { resolveListingImageUrl } from "../../api/services/listings";
import { logout } from "../../api/services/auth";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "../listingFormOptions";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";

type FormMode = "create" | "edit";

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

function parseCurrencyInput(value: string) {
  return Number(value.replace(/\D/g, ""));
}

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
  const MAX_LISTING_IMAGES = 20;
  const navigate = useNavigate();
  const [listings, setListings] = useState<ImportedListing[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [sourceDuplicateMessage, setSourceDuplicateMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingImageCount, setExistingImageCount] = useState(0);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; imageUrl: string }>>([]);
  const [originalImages, setOriginalImages] = useState<Array<{ id: string; imageUrl: string }>>([]);
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
    if (key === "source" && typeof value === "string") {
      const normalizedSource = value.trim().toLowerCase();
      if (!normalizedSource) {
        setSourceDuplicateMessage("");
      } else {
        const duplicateSource = listings.find((listing) => {
          if (formMode === "edit" && listing.id === editingId) {
            return false;
          }
          return (listing.source || "").trim().toLowerCase() === normalizedSource;
        });
        setSourceDuplicateMessage(duplicateSource ? "Link bài đăng gốc đã tồn tại trong hệ thống." : "");
      }
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm());
    setSelectedAmenityIds([]);
    setFormError("");
    setSourceDuplicateMessage("");
    setFormMode("create");
    setEditingId(null);
    setExistingImageCount(0);
    setExistingImages([]);
    setOriginalImages([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm());
    setSelectedAmenityIds([]);
    setFormError("");
    setSourceDuplicateMessage("");
    setFormMode("create");
    setEditingId(null);
    setExistingImageCount(0);
    setExistingImages([]);
    setOriginalImages([]);
  };

  const openEdit = (listing: ImportedListing) => {
    const existingUrls = (listing.images || [])
      .map((img) => img.imageUrl)
      .filter((url) => url && url.trim())
      .join("\n");
    
    const imagesList = (listing.images || []).map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
    }));
    
    setExistingImages(imagesList);
    setOriginalImages(imagesList);
    
    setForm({
      title: listing.title,
      description: listing.description,
      rentPrice: Number(listing.rentPrice || 0).toLocaleString("vi-VN"),
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
      imageUrls: existingUrls,
    });
    setSelectedAmenityIds((listing.amenities || []).map((a) => a.id));
    setFormError("");
    setSourceDuplicateMessage("");
    setFormMode("edit");
    setEditingId(listing.id);
    setExistingImageCount((listing.images || []).length);
    setShowForm(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.title || !form.description || !form.rentPrice || !form.district || !form.source) {
      setFormError("Vui lòng điền đầy đủ tiêu đề, mô tả, giá, quận/huyện và link nguồn.");
      return;
    }

    if (sourceDuplicateMessage) {
      setFormError(sourceDuplicateMessage);
      return;
    }

    const rentPrice = parseCurrencyInput(form.rentPrice);
    if (Number.isNaN(rentPrice) || rentPrice <= 0) {
      setFormError("Giá thuê không hợp lệ.");
      return;
    }
    if (!form.source.startsWith("http://") && !form.source.startsWith("https://")) {
      setFormError("Link nguồn phải bắt đầu bằng http:// hoặc https://");
      return;
    }

    const normalizedSource = form.source.trim().toLowerCase();
    const duplicateSource = listings.find((listing) => {
      if (formMode === "edit" && listing.id === editingId) {
        return false;
      }
      return (listing.source || "").trim().toLowerCase() === normalizedSource;
    });
    if (duplicateSource) {
      setFormError("Link bài đăng gốc đã tồn tại trong hệ thống.");
      return;
    }

    const urlLines = form.imageUrls
      .split("\n")
        .map((u: string) => u.trim())
        .filter((u: string) => u.startsWith("http://") || u.startsWith("https://"));

    if (formMode === "create" && urlLines.length > MAX_LISTING_IMAGES) {
      setFormError(`Chỉ được nhập tối đa ${MAX_LISTING_IMAGES} URLs hình ảnh.`);
      return;
    }

    if (formMode === "edit" && existingImageCount + urlLines.length > MAX_LISTING_IMAGES) {
      const available = Math.max(0, MAX_LISTING_IMAGES - existingImageCount);
      setFormError(`Bài đăng hiện có ${existingImageCount} ảnh. Bạn chỉ có thể thêm tối đa ${available} URLs nữa.`);
      return;
    }

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
        
        // Handle deleted images (those in originalImages but not in current form.imageUrls)
        const deletedImages = originalImages.filter(
          (original) => !urlLines.some((url) => url.trim() === original.imageUrl.trim())
        );
        for (const img of deletedImages) {
          await deleteImportedListingImage(editingId, img.id);
        }
        
        // Add only truly new image URLs (those not in originalImages)
        const newUrls = urlLines.filter(
          (url) => !originalImages.some((img) => img.imageUrl.trim() === url.trim())
        );
        if (newUrls.length > 0) {
          await addImportedListingImageUrls(editingId, newUrls);
        }
      }
      setShowForm(false);
      setExistingImages([]);
      setOriginalImages([]);
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="imported-listings" onLogout={handleLogout} />

        <main className="flex-1 min-w-0 space-y-6">

          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">Bảng điều khiển</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Quản lý nguồn bài đăng</h1>
              <p className="mt-1 text-sm text-slate-500">Import và quản lý bài đăng từ các nền tảng bên ngoài.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full max-w-xs rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--primary)]"
                placeholder="Tìm kiếm tiêu đề, link nguồn..."
              />
              <button
                onClick={openCreate}
                className="shrink-0 rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
              >
                + Thêm bài đăng
              </button>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {showForm && (
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">
                  {formMode === "create" ? "Thêm bài đăng từ nguồn bên ngoài" : "Chỉnh sửa bài đăng"}
                </h2>
                <button onClick={() => closeForm()} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>

              {formError && (
                <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">⚠ {formError}</p>
              )}

              <form onSubmit={handleSubmitForm} className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600 mb-3">🔗 Nguồn bài đăng</h3>
                  <label className="block text-sm font-medium text-slate-700">
                    Link bài đăng gốc <span className="text-red-400">*</span>
                    <input
                      type="url"
                      value={form.source}
                      onChange={(e) => handleChange("source", e.target.value)}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                      placeholder="https://nhatot.com/..."
                    />
                    {sourceDuplicateMessage && (
                      <p className="mt-2 text-xs font-semibold text-red-600">{sourceDuplicateMessage}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">Link gốc được lưu để đảm bảo tính minh bạch pháp lý và không được trùng trong hệ thống.</p>
                  </label>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    URLs hình ảnh từ nguồn gốc
                    {formMode === "edit" && existingImages.length > 0 && (
                      <div className="mt-3 mb-4">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Hình ảnh hiện có ({existingImages.length}):</p>
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                          {existingImages.map((img) => (
                            <div key={img.id} className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-50 hover:border-red-300 transition">
                              <img 
                                src={img.imageUrl} 
                                alt="preview" 
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23e2e8f0' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='12' fill='%23cbd5e1' text-anchor='middle' dy='.3em'%3EError%3C/text%3E%3C/svg%3E";
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setExistingImages(existingImages.filter((x) => x.id !== img.id));
                                  const newUrls = form.imageUrls
                                    .split("\n")
                                    .filter((u) => u.trim() !== img.imageUrl.trim())
                                    .join("\n");
                                  setForm({ ...form, imageUrls: newUrls });
                                }}
                                className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold text-lg cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      rows={3}
                      value={form.imageUrls}
                      onChange={(e) => handleChange("imageUrls", e.target.value)}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-mono outline-none focus:border-blue-400"
                      placeholder={"https://cdn.example.com/img1.jpg\nhttps://cdn.example.com/img2.jpg"}
                    />
                    <p className="mt-1 text-xs text-slate-400">Mỗi URL một dòng. Ảnh tham chiếu trực tiếp, không tải về server.</p>
                    {formMode === "create" && (
                      <p className="mt-1 text-xs text-slate-400">Tối đa 20 URLs ảnh cho mỗi bài đăng.</p>
                    )}
                    {formMode === "edit" && (
                      <p className="mt-1 text-xs text-slate-400">
                        Bài đăng hiện có {existingImages.length} ảnh. 
                        {existingImages.length < MAX_LISTING_IMAGES && (
                          <> Bạn có thể thêm tối đa {MAX_LISTING_IMAGES - existingImages.length} URLs mới.</>
                        )}
                        {existingImages.length === MAX_LISTING_IMAGES && (
                          <> Bài đăng đã đạt giới hạn tối đa 20 ảnh.</>
                        )}
                      </p>
                    )}
                  </label>
                </div>

                <label className="block md:col-span-2 text-sm font-medium text-slate-700">
                  Tiêu đề <span className="text-red-400">*</span>
                  <input type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="Phòng trọ đầy đủ tiện nghi" />
                </label>

                <label className="block md:col-span-2 text-sm font-medium text-slate-700">
                  Mô tả <span className="text-red-400">*</span>
                  <textarea rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="Mô tả chi tiết..." />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Giá thuê (VND) <span className="text-red-400">*</span>
                  <input type="text" inputMode="numeric" value={form.rentPrice} onChange={(e) => handleChange("rentPrice", formatCurrencyInput(e.target.value))}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="3.000.000" />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Diện tích (m²)
                  <input type="number" value={form.roomAreaSqm} onChange={(e) => handleChange("roomAreaSqm", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]" />
                </label>

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)] mb-3">Vị trí</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Tỉnh/Thành phố
                      <select value={form.city} onChange={(e) => handleChange("city", e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                        {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Quận/Huyện <span className="text-red-400">*</span>
                      <select value={form.district} onChange={(e) => handleChange("district", e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                        {DISTRICT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Phường/Xã
                      <select value={form.ward} onChange={(e) => handleChange("ward", e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                        {(WARD_OPTIONS[form.district] || []).map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block text-sm font-medium text-slate-700">
                    Địa chỉ cụ thể
                    <input type="text" value={form.address} onChange={(e) => handleChange("address", e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                  </label>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Loại phòng
                  <input type="text" value={form.roomType} onChange={(e) => handleChange("roomType", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="Phòng trọ / Căn hộ" />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Giới tính ưu tiên
                  <input type="text" value={form.preferredGender} onChange={(e) => handleChange("preferredGender", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="Nam / Nữ / Không yêu cầu" />
                </label>

                {amenities.length > 0 && (
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)] mb-3">Tiện nghi</h3>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {amenities.map((a) => (
                        <label key={a.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
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
                    className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition">
                    {actionLoading ? "Đang lưu..." : formMode === "create" ? "Lưu bản nháp" : "Cập nhật"}
                  </button>
                  <button type="button" onClick={() => closeForm()}
                    className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Hủy
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
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
              <div className="divide-y divide-slate-100">
                {paged.map((listing) => {
                  const thumb = listing.images?.[0]?.imageUrl
                    ? resolveListingImageUrl(listing.images[0].imageUrl)
                    : null;
                  const badge = STATUS_LABELS[listing.status] || { text: listing.status, cls: "bg-slate-100 text-slate-600 border border-slate-200" };
                  let sourceDomain = "";
                  try { sourceDomain = new URL(listing.source || "").hostname; } catch { sourceDomain = listing.source || ""; }

                  return (
                    <div key={listing.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition">
                      <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
                        <button onClick={() => navigate(`/listings/${listing.id}`)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                          Xem bài đăng
                        </button>
                        <button onClick={() => openEdit(listing)}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
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
