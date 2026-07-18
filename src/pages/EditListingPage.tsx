import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, FileText, Home, Image, MapPinned, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { getMyListingDetail, updateMyListing, uploadListingImages, resolveListingImageUrl, deleteListingImage } from "../api/services/listings";
import { fetchAmenities } from "../api/services/amenities";
import { fetchProfile, updateProfile } from "../api/services/user";
import type { Amenity } from "../api/services/amenities";
import UserShell from "../layouts/UserShell";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "./listingFormOptions";
import type { Listing } from "../api/services/listings";
import { useToast } from "../contexts/ToastContext";

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

function parseCurrencyInput(value: string) {
  return Number(value.replace(/\D/g, ""));
}

export default function EditListingPage() {
  const MAX_LISTING_IMAGES = 20;
  const navigate = useNavigate();
  const { id } = useParams();
  const [status, setStatus] = useState("Đang tải...");
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const [listing, setListing] = useState<Listing | null>(null);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesError, setAmenitiesError] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [userFullName, setUserFullName] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", phoneNumber: "", rentPrice: "",
    city: CITY_OPTIONS[0] || "", district: DISTRICT_OPTIONS[0] || "",
    ward: WARD_OPTIONS[DISTRICT_OPTIONS[0]]?.[0] || "",
    address: "", preferredGender: "", roomType: "", roomAreaSqm: "",
    smokingAllowed: false, petAllowed: false,
  });

  useEffect(() => { fetchAmenities().then(setAmenities).catch(() => setAmenitiesError("Không thể tải danh sách tiện nghi.")); }, []);
  useEffect(() => { fetchProfile().then((p) => setUserFullName(p.fullName)).catch(() => {}); }, []);

  useEffect(() => {
    if (!id) return;
    getMyListingDetail(id)
      .then((data) => {
        setListing(data);
        setSelectedAmenityIds((data.amenities || []).map((a) => a.id));
        setForm({
          title: data.title, description: data.description, phoneNumber: data.ownerPhone || "",
          rentPrice: data.rentPrice ? formatCurrencyInput(String(data.rentPrice)) : "",
          city: data.city || CITY_OPTIONS[0] || "", district: data.district || DISTRICT_OPTIONS[0] || "",
          ward: data.ward || WARD_OPTIONS[data.district || ""]?.[0] || "",
          address: data.address || "", preferredGender: data.preferredGender || "",
          roomType: data.roomType || "", roomAreaSqm: data.roomAreaSqm ? String(data.roomAreaSqm) : "",
          smokingAllowed: data.smokingAllowed, petAllowed: data.petAllowed,
        });
        setStatus("");
      })
      .catch(() => { setError("Không thể tải bài đăng."); setStatus(""); });
  }, [id]);

  useEffect(() => {
    const wards = WARD_OPTIONS[form.district] || [];
    if (wards.length > 0 && !wards.includes(form.ward)) setForm((prev) => ({ ...prev, ward: wards[0] }));
  }, [form.district, form.ward]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenityIds((prev) => prev.includes(amenityId) ? prev.filter((aid) => aid !== amenityId) : [...prev, amenityId]);
  };

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImagesChange = (files: FileList | null) => {
    if (!files) { setImageFiles([]); setImagePreviews([]); return; }
    const existingCount = listing?.images.length ?? 0;
    const maxNewImages = Math.max(0, MAX_LISTING_IMAGES - existingCount);
    if (maxNewImages === 0) { setError(`Bài đăng đã đạt giới hạn ${MAX_LISTING_IMAGES} ảnh.`); return; }
    setImageFiles((prevFiles) => {
      const merged = [...prevFiles, ...Array.from(files)];
      if (merged.length > maxNewImages) setError(`Bạn chỉ có thể thêm tối đa ${maxNewImages} ảnh nữa.`);
      const limited = merged.slice(0, maxNewImages);
      setImagePreviews(limited.map((file) => URL.createObjectURL(file)));
      return limited;
    });
  };

  const handleRemoveImagePreview = (indexToRemove: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!id || !listing) return;
    if (listing.images.length <= 1) { setError("Bài đăng phải có ít nhất 1 hình ảnh."); return; }
    setError("");
    try {
      await deleteListingImage(id, imageId);
      setListing((prev) => prev ? { ...prev, images: prev.images.filter((img) => img.id !== imageId) } : null);
    } catch { setError("Không thể xóa hình ảnh. Vui lòng thử lại."); }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(""); setError("");
    if (!id) return;

    if (!form.title || !form.description || !form.rentPrice || !form.city || !form.district || !form.ward) {
      const msg = "Vui lòng nhập đầy đủ tiêu đề, mô tả, giá và khu vực.";
      showToast({ type: "error", message: msg }); setError(msg); return;
    }
    if (!form.phoneNumber) {
      const msg = "Vui lòng nhập Số điện thoại liên hệ.";
      showToast({ type: "error", message: msg }); setError(msg); return;
    }
    if (form.phoneNumber && !/^(\+?\d[\d\s.-]{7,20})$/.test(form.phoneNumber)) {
      const msg = "Số điện thoại không hợp lệ.";
      showToast({ type: "error", message: msg }); setError(msg); return;
    }
    const rentPrice = parseCurrencyInput(form.rentPrice);
    if (Number.isNaN(rentPrice) || rentPrice <= 0) { setError("Giá thuê không hợp lệ."); return; }
    const roomAreaSqm = form.roomAreaSqm ? Number(form.roomAreaSqm) : null;
    if (roomAreaSqm !== null && (Number.isNaN(roomAreaSqm) || roomAreaSqm <= 0)) {
      const msg = "Diện tích phòng không hợp lệ.";
      showToast({ type: "error", message: msg }); setError(msg); return;
    }

    try {
      const updated = await updateMyListing(id, {
        title: form.title, description: form.description, rentPrice,
        city: form.city, district: form.district, ward: form.ward,
        address: form.address || null, preferredGender: form.preferredGender || null,
        roomType: form.roomType || null, roomAreaSqm,
        smokingAllowed: form.smokingAllowed, petAllowed: form.petAllowed,
        amenityIds: selectedAmenityIds,
      });
      if (imageFiles.length > 0) await uploadListingImages(updated.id, imageFiles);
      if (form.phoneNumber && userFullName) {
        await updateProfile({ fullName: userFullName, phoneNumber: form.phoneNumber }).catch(() => {});
      }
      setStatus("Cập nhật bài đăng thành công.");
      navigate(`/my-listings/${updated.id}`);
    } catch {
      const msg = "Không thể cập nhật bài đăng. Vui lòng thử lại.";
      showToast({ type: "error", message: msg }); setError(msg);
    }
  };

  return (
    <UserShell>
      <div className="min-h-screen bg-slate-50">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-[1100px] px-4 md:px-6 py-3">
            <nav className="flex items-center gap-2 text-xs text-slate-500">
              <button onClick={() => navigate("/my-listings")} className="flex items-center gap-1 hover:text-[#a55b00] transition">
                <Home className="h-3.5 w-3.5" /> Bài đăng của tôi
              </button>
              <ChevronRight className="h-3 w-3" />
              <span className="max-w-[220px] truncate font-medium text-slate-800">{listing?.title || "Chỉnh sửa"}</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 md:px-6 py-6 lg:py-8">
          <header>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-[var(--on-surface)] md:text-3xl" style={{ fontFamily: "var(--font-main)" }}>
                  Chỉnh sửa bài đăng
                </h1>
                <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin và hình ảnh cho bài đăng của bạn.</p>
              </div>
              <button onClick={() => navigate(`/my-listings/${id}`)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                Xem chi tiết
              </button>
            </div>
          </header>

          {status && <p className="rounded-[var(--radius-md)] bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{status}</p>}
          {error && <p className="rounded-[var(--radius-md)] bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
          {listing?.status === "APPROVED" && (
            <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              Bài đăng này đang ở trạng thái đã duyệt. Khi lưu chỉnh sửa, bài sẽ tạm ẩn khỏi trang công khai và chuyển về chờ admin duyệt lại.
            </p>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              {/* Ảnh hiện tại */}
              {listing && listing.images.length > 0 && (
                <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                      <Image className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Ảnh hiện tại</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {listing.images.map((image) => (
                      <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white">
                        <img src={resolveListingImageUrl(image.imageUrl)} alt={listing.title} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => handleDeleteExistingImage(image.id)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow hover:bg-red-600 transition"
                          title="Xóa ảnh">×</button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Section: Thông tin cơ bản */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <FileText className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Thông tin cơ bản</h2>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Tiêu đề
                    <input type="text" value={form.title} onChange={(e) => handleChange("title", e.target.value)}
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      placeholder="Phòng trọ đầy đủ tiện nghi" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Mô tả
                    <textarea rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      placeholder="Mô tả chi tiết về phòng, tiện ích, yêu cầu người ở ghép..." />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Số điện thoại liên hệ *
                    <input type="tel" value={form.phoneNumber} onChange={(e) => handleChange("phoneNumber", e.target.value)}
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      placeholder="0912345678" />
                  </label>
                </div>
              </section>

              {/* Section: Vị trí */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <MapPinned className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Vị trí</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Tỉnh/Thành phố
                      <select value={form.city} onChange={(e) => handleChange("city", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]">
                        {CITY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Quận
                      <select value={form.district} onChange={(e) => handleChange("district", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]">
                        {DISTRICT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Phường
                      <select value={form.ward} onChange={(e) => handleChange("ward", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]">
                        {(WARD_OPTIONS[form.district] || []).map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-slate-700">
                    Địa chỉ cụ thể
                    <input type="text" value={form.address} onChange={(e) => handleChange("address", e.target.value)}
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      placeholder="123 Đường ABC" />
                  </label>
                </div>
              </section>

              {/* Section: Giá & Thông tin phòng */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Giá & Thông tin phòng</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Giá thuê (VND) *
                      <input type="text" inputMode="numeric" value={form.rentPrice}
                        onChange={(e) => handleChange("rentPrice", formatCurrencyInput(e.target.value))}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                        placeholder="3.000.000" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Diện tích phòng (m²)
                      <input type="number" value={form.roomAreaSqm} onChange={(e) => handleChange("roomAreaSqm", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                        placeholder="20" />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Giới tính ưu tiên
                      <input type="text" value={form.preferredGender} onChange={(e) => handleChange("preferredGender", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                        placeholder="Nam / Nữ / Không yêu cầu" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Loại phòng
                      <input type="text" value={form.roomType} onChange={(e) => handleChange("roomType", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                        placeholder="Phòng trọ / Căn hộ" />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" checked={form.smokingAllowed} onChange={(e) => handleChange("smokingAllowed", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] accent-[var(--primary)]" />
                      Cho phép hút thuốc
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input type="checkbox" checked={form.petAllowed} onChange={(e) => handleChange("petAllowed", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] accent-[var(--primary)]" />
                      Cho phép thú cưng
                    </label>
                  </div>
                </div>
              </section>

              {/* Section: Hình ảnh mới */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <Image className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Thêm hình ảnh mới</h2>
                </div>
                <p className="text-xs text-slate-500 mb-3">Tối đa 20 ảnh, định dạng JPG/PNG.</p>
                <input type="file" multiple accept="image/*" onChange={(e) => handleImagesChange(e.target.files)}
                  className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]" />
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={`${preview}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white">
                        <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => handleRemoveImagePreview(index)}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow hover:bg-red-600 transition">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Section: Tiện nghi */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Tiện nghi</h2>
                </div>
                {amenitiesError ? (
                  <p className="text-xs text-red-500">{amenitiesError}</p>
                ) : amenities.length === 0 ? (
                  <p className="text-xs text-slate-400">Đang tải tiện nghi...</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {amenities.map((amenity) => (
                      <label key={amenity.id} className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-[var(--primary)] transition">
                        <input type="checkbox" checked={selectedAmenityIds.includes(amenity.id)} onChange={() => toggleAmenity(amenity.id)}
                          className="h-4 w-4 rounded border-slate-300 accent-[var(--primary)]" />
                        {amenity.name}
                      </label>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right: sidebar */}
            <div className="space-y-5">
              <div className="rounded-[var(--radius-md)] bg-gradient-to-br from-[#8B5E34] to-[#6B3F1D] p-6 text-white">
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-main)" }}>Chỉnh sửa bài đăng</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Thay đổi sẽ được lưu và bài đăng chuyển về trạng thái chờ duyệt lại.
                </p>
              </div>

              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-bold text-[var(--on-surface)]">Lưu ý</h4>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-container)]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Bài đã duyệt sẽ tạm ẩn khi bạn chỉnh sửa.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-container)]">
                      <Trash2 className="h-3.5 w-3.5 text-[var(--primary)]" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Bài đăng phải có ít nhất 1 hình ảnh.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="flex flex-col items-center gap-4 border-t border-slate-100 pt-6 pb-4 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => navigate(`/my-listings/${id}`)}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-700">
              Quay lại chi tiết
            </button>
            <button type="submit" onClick={(e) => { e.preventDefault(); document.querySelector("form")?.requestSubmit(); }}
              className="w-full rounded-full bg-[var(--primary)] px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-200/50 transition hover:opacity-90 active:scale-[0.98] sm:w-auto">
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </UserShell>
  );
}
