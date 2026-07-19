import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, FileText, Home, Image, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { createMyListingDraft, uploadListingImages } from "../api/services/listings";
import { fetchAmenities, type Amenity } from "../api/services/amenities";
import { fetchProfile, updateProfile } from "../api/services/user";
import UserShell from "../layouts/UserShell";
import { useToast } from "../contexts/ToastContext";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "./listingFormOptions";

function formatCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("vi-VN");
}

function parseCurrencyInput(value: string) {
  return Number(value.replace(/\D/g, ""));
}

export default function CreateListingPage() {
  const MAX_LISTING_IMAGES = 20;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [amenitiesError, setAmenitiesError] = useState("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [userFullName, setUserFullName] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    phoneNumber: "",
    rentPrice: "",
    city: CITY_OPTIONS[0] || "",
    district: DISTRICT_OPTIONS[0] || "",
    ward: WARD_OPTIONS[DISTRICT_OPTIONS[0]]?.[0] || "",
    address: "",
    preferredGender: "",
    roomType: "",
    roomAreaSqm: "",
    smokingAllowed: false,
    petAllowed: false,
  });

  useEffect(() => {
    const wards = WARD_OPTIONS[form.district] || [];
    if (wards.length > 0 && !wards.includes(form.ward)) {
      setForm((prev) => ({ ...prev, ward: wards[0] }));
    }
  }, [form.district, form.ward]);

  useEffect(() => {
    let isMounted = true;
    fetchAmenities()
      .then((data) => { if (isMounted) setAmenities(data); })
      .catch(() => { if (isMounted) setAmenitiesError(t("Không thể tải danh sách tiện nghi.")); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchProfile()
      .then((profile) => {
        if (!isMounted) return;
        setUserFullName(profile.fullName);
        if (profile.phoneNumber) {
          setForm((prev) => ({ ...prev, phoneNumber: prev.phoneNumber || profile.phoneNumber || "" }));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImagesChange = (files: FileList | null) => {
    if (!files) { setImageFiles([]); setImagePreviews([]); return; }
    setImageFiles((prevFiles) => {
      const merged = [...prevFiles, ...Array.from(files)];
      if (merged.length > MAX_LISTING_IMAGES) setError(t("Bạn chỉ có thể thêm tối đa {{max}} ảnh.", { max: MAX_LISTING_IMAGES }));
      const limited = merged.slice(0, MAX_LISTING_IMAGES);
      setImagePreviews(limited.map((file) => URL.createObjectURL(file)));
      return limited;
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenityIds((prev) => prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]);
  };

  const handleRemoveImagePreview = (indexToRemove: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(""); setError("");

    if (!form.title || !form.description || !form.rentPrice || !form.city || !form.district || !form.ward) {
      const msg = "Vui lòng nhập đầy đủ tiêu đề, mô tả, giá và khu vực.";
      showToast({ type: "error", message: msg }); setError(msg); return;
    }
    const rentPrice = parseCurrencyInput(form.rentPrice);
    if (Number.isNaN(rentPrice) || rentPrice <= 0) {
      const msg = "Giá thuê không hợp lệ.";
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
    const roomAreaSqm = form.roomAreaSqm ? Number(form.roomAreaSqm) : null;
    if (roomAreaSqm !== null && (Number.isNaN(roomAreaSqm) || roomAreaSqm <= 0)) {
      const msg = "Diện tích phòng không hợp lệ.";
      showToast({ type: "error", message: msg }); setError(msg); return;
    }

    try {
      const listing = await createMyListingDraft({
        title: form.title, description: form.description, rentPrice,
        city: form.city, district: form.district, ward: form.ward,
        address: form.address || null, preferredGender: form.preferredGender || null,
        roomType: form.roomType || null, roomAreaSqm,
        smokingAllowed: form.smokingAllowed, petAllowed: form.petAllowed,
        amenityIds: selectedAmenityIds,
      });
      if (imageFiles.length > 0) await uploadListingImages(listing.id, imageFiles);
      if (form.phoneNumber && userFullName) {
        await updateProfile({ fullName: userFullName, phoneNumber: form.phoneNumber }).catch(() => {});
      }
      setStatus("Tạo bài đăng thành công.");
      navigate(`/my-listings/${listing.id}`);
    } catch {
      const msg = "Không thể tạo bài đăng. Vui lòng thử lại.";
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
              <span className="font-medium text-slate-800">Tạo mới</span>
            </nav>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 md:px-6 py-6 lg:py-8">
          <header>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-[var(--on-surface)] md:text-3xl" style={{ fontFamily: "var(--font-main)" }}>
                  Tạo bài đăng mới
                </h1>
                <p className="mt-1 text-sm text-slate-500">Bài đăng sẽ được lưu ở trạng thái bản nháp (DRAFT).</p>
              </div>
            </div>
          </header>

          {status && <p className="rounded-[var(--radius-md)] bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{status}</p>}
          {error && <p className="rounded-[var(--radius-md)] bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-5">
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
                      placeholder="VD: 0901234567" />
                    <p className="mt-1 text-xs text-slate-500">Tự động lấy từ hồ sơ cá nhân nếu bạn đã cập nhật trước đó.</p>
                  </label>
                </div>
              </section>

              {/* Section: Vị trí */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <MapPin className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Vị trí</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      Tỉnh/Thành phố
                      <select value={form.city} onChange={(e) => handleChange("city", e.target.value)}
                        className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]">
                        {CITY_OPTIONS.map((city) => <option key={city} value={city}>{city}</option>)}
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

              {/* Section: Hình ảnh */}
              <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                    <Image className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Hình ảnh phòng</h2>
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
                  <p className="text-xs text-slate-500">Chưa có tiện nghi nào.</p>
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
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-main)" }}>Mẹo đăng bài</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Bài đăng có đầy đủ thông tin và hình ảnh sẽ được quan tâm nhiều hơn.
                </p>
                <div className="mt-4 space-y-2">
                  {["Thêm ít nhất 3 ảnh chất lượng cao", "Mô tả chi tiết tiện nghi phòng", "Nhập đúng giá và diện tích"].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/60" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                <h4 className="text-sm font-bold text-[var(--on-surface)]">Lưu ý quan trọng</h4>
                <div className="mt-3 space-y-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-container)]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Bài đăng sẽ ở trạng thái bản nháp và chờ admin phê duyệt.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-container)]">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Không đăng tin trùng lặp hoặc vi phạm quy định.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[var(--radius-md)]">
                <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop" alt="Phòng trọ" className="h-44 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-3 left-4 text-sm font-bold text-white">Đăng bài ngay</p>
              </div>
            </div>
          </form>

          <div className="flex flex-col items-center gap-4 border-t border-slate-100 pt-6 pb-4 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => navigate("/my-listings")}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-700">
              Quay lại danh sách
            </button>
            <button type="submit" onClick={(e) => { e.preventDefault(); document.querySelector("form")?.requestSubmit(); }}
              className="w-full rounded-full bg-[var(--primary)] px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-200/50 transition hover:opacity-90 active:scale-[0.98] sm:w-auto">
              Lưu bản nháp
            </button>
          </div>
        </div>
      </div>
    </UserShell>
  );
}
