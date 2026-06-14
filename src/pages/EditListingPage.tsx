import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyListingDetail, updateMyListing, uploadListingImages, resolveListingImageUrl, deleteListingImage } from "../api/services/listings";
import { fetchAmenities } from "../api/services/amenities";
import { fetchProfile, updateProfile } from "../api/services/user";
import type { Amenity } from "../api/services/amenities";
import UserShell from "../layouts/UserShell";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "./listingFormOptions";
import type { Listing } from "../api/services/listings";

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
  const [listing, setListing] = useState<Listing | null>(null);
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
    availableFrom: "",
    preferredGender: "",
    roomType: "",
    roomAreaSqm: "",
    maxOccupants: "",
    currentOccupants: "0",
    smokingAllowed: false,
    petAllowed: false,
  });

  useEffect(() => {
    fetchAmenities()
      .then(setAmenities)
      .catch(() => setAmenitiesError("Không thể tải danh sách tiện nghi."));
  }, []);

  useEffect(() => {
    fetchProfile().then((p) => setUserFullName(p.fullName)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    getMyListingDetail(id)
      .then((data) => {
        setListing(data);
        setSelectedAmenityIds((data.amenities || []).map((a) => a.id));
        setForm({
          title: data.title,
          description: data.description,
          phoneNumber: data.ownerPhone || "",
          rentPrice: data.rentPrice ? formatCurrencyInput(String(data.rentPrice)) : "",
          city: data.city || CITY_OPTIONS[0] || "",
          district: data.district || DISTRICT_OPTIONS[0] || "",
          ward: data.ward || WARD_OPTIONS[data.district || ""]?.[0] || "",
          address: data.address || "",
          availableFrom: data.availableFrom || "",
          preferredGender: data.preferredGender || "",
          roomType: data.roomType || "",
          roomAreaSqm: data.roomAreaSqm ? String(data.roomAreaSqm) : "",
          maxOccupants: data.maxOccupants ? String(data.maxOccupants) : "",
          currentOccupants: data.currentOccupants ? String(data.currentOccupants) : "0",
          smokingAllowed: data.smokingAllowed,
          petAllowed: data.petAllowed,
        });
        setStatus("");
      })
      .catch(() => {
        setError("Không thể tải bài đăng.");
        setStatus("");
      });
  }, [id]);

  useEffect(() => {
    const wards = WARD_OPTIONS[form.district] || [];
    if (wards.length > 0 && !wards.includes(form.ward)) {
      setForm((prev) => ({ ...prev, ward: wards[0] }));
    }
  }, [form.district, form.ward]);

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImagesChange = (files: FileList | null) => {
    if (!files) {
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }
    const existingCount = listing?.images.length ?? 0;
    const maxNewImages = Math.max(0, MAX_LISTING_IMAGES - existingCount);
    if (maxNewImages === 0) {
      setError(`Bài đăng đã đạt giới hạn ${MAX_LISTING_IMAGES} ảnh.`);
      return;
    }
    setImageFiles((prevFiles) => {
      const merged = [...prevFiles, ...Array.from(files)];
      if (merged.length > maxNewImages) {
        setError(`Bạn chỉ có thể thêm tối đa ${maxNewImages} ảnh nữa (tổng cộng ${MAX_LISTING_IMAGES} ảnh).`);
      }
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
    if (listing.images.length <= 1) {
      setError("Bài đăng phải có ít nhất 1 hình ảnh.");
      return;
    }
    setError("");
    try {
      await deleteListingImage(id, imageId);
      setListing((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.filter((img) => img.id !== imageId),
        };
      });
    } catch {
      setError("Không thể xóa hình ảnh. Vui lòng thử lại.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!id) return;

    if (!form.title || !form.description || !form.rentPrice || !form.city || !form.district || !form.ward) {
      setError("Vui lòng nhập đầy đủ tiêu đề, mô tả, giá và khu vực.");
      return;
    }

    const rentPrice = parseCurrencyInput(form.rentPrice);
    if (Number.isNaN(rentPrice) || rentPrice <= 0) {
      setError("Giá thuê không hợp lệ.");
      return;
    }

    const roomAreaSqm = form.roomAreaSqm ? Number(form.roomAreaSqm) : null;
    if (roomAreaSqm !== null && (Number.isNaN(roomAreaSqm) || roomAreaSqm <= 0)) {
      setError("Diện tích phòng không hợp lệ.");
      return;
    }

    try {
      const updated = await updateMyListing(id, {
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
        roomAreaSqm,
        maxOccupants: form.maxOccupants ? Number(form.maxOccupants) : null,
        currentOccupants: form.currentOccupants ? Number(form.currentOccupants) : 0,
        smokingAllowed: form.smokingAllowed,
        petAllowed: form.petAllowed,
        amenityIds: selectedAmenityIds,
      });

      if (imageFiles.length > 0) {
        await uploadListingImages(updated.id, imageFiles);
      }

      if (form.phoneNumber && userFullName) {
        await updateProfile({ fullName: userFullName, phoneNumber: form.phoneNumber }).catch(() => {});
      }

      setStatus("Cập nhật bài đăng thành công.");
      navigate(`/my-listings/${updated.id}`);
    } catch {
      setError("Không thể cập nhật bài đăng. Vui lòng thử lại.");
    }
  };

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[860px] rounded-[28px] border border-orange-100 bg-white p-8 shadow-[0_25px_80px_-40px_rgba(255,115,0,0.6)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Chỉnh sửa bài đăng</h1>
            <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin và hình ảnh cho bài đăng của bạn.</p>
          </div>
          <button
            onClick={() => navigate(`/my-listings/${id}`)}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Xem chi tiết
          </button>
        </div>

        {status && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{status}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}
        {listing?.status === "APPROVED" && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            Bài đăng này đang ở trạng thái đã duyệt. Khi lưu chỉnh sửa, bài sẽ tạm ẩn khỏi trang công khai và chuyển về chờ admin duyệt lại.
          </p>
        )}

        {listing && listing.images.length > 0 && (
          <div className="mt-6 rounded-[22px] border border-orange-100 bg-orange-50/40 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Ảnh hiện tại</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {listing.images.map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-orange-100 bg-white"
                >
                  <img
                    src={resolveListingImageUrl(image.imageUrl)}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteExistingImage(image.id)}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow hover:bg-red-600 transition"
                    title="Xóa ảnh"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Tiêu đề
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleChange("title", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="Phòng trọ đầy đủ tiện nghi"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Mô tả
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="Mô tả chi tiết về phòng, tiện ích, yêu cầu người ở ghép..."
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Số điện thoại liên hệ
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => handleChange("phoneNumber", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="0912345678"
            />
          </label>

          <div className="md:col-span-2 rounded-[22px] border border-orange-100 bg-orange-50/40 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Vị trí</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Tỉnh/Thành phố
                <select
                  value={form.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                >
                  {CITY_OPTIONS.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Quận
                <select
                  value={form.district}
                  onChange={(event) => handleChange("district", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                >
                  {DISTRICT_OPTIONS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phường
                <select
                  value={form.ward}
                  onChange={(event) => handleChange("ward", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                >
                  {(WARD_OPTIONS[form.district] || []).map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Địa chỉ cụ thể
              <input
                type="text"
                value={form.address}
                onChange={(event) => handleChange("address", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
                placeholder="123 Đường ABC"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Giá thuê (VND)
            <input
              type="text"
              inputMode="numeric"
              value={form.rentPrice}
              onChange={(event) => handleChange("rentPrice", formatCurrencyInput(event.target.value))}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="3.000.000"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Diện tích phòng (m2)
            <input
              type="number"
              value={form.roomAreaSqm}
              onChange={(event) => handleChange("roomAreaSqm", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="20"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Ngày có thể ở
            <input
              type="date"
              value={form.availableFrom}
              onChange={(event) => handleChange("availableFrom", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Giới tính ưu tiên
            <input
              type="text"
              value={form.preferredGender}
              onChange={(event) => handleChange("preferredGender", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="Nam / Nữ / Không yêu cầu"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Loại phòng
            <input
              type="text"
              value={form.roomType}
              onChange={(event) => handleChange("roomType", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="Phòng trọ / Căn hộ"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Số người tối đa
            <input
              type="number"
              value={form.maxOccupants}
              onChange={(event) => handleChange("maxOccupants", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="2"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Đang ở (người)
            <input
              type="number"
              value={form.currentOccupants}
              onChange={(event) => handleChange("currentOccupants", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="0"
            />
          </label>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.smokingAllowed}
                onChange={(event) => handleChange("smokingAllowed", event.target.checked)}
                className="h-4 w-4 rounded border-orange-200 text-orange-500"
              />
              Cho phép hút thuốc
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.petAllowed}
                onChange={(event) => handleChange("petAllowed", event.target.checked)}
                className="h-4 w-4 rounded border-orange-200 text-orange-500"
              />
              Cho phép thú cưng
            </label>
          </div>

          {/* Tiện nghi */}
          <div className="md:col-span-2 rounded-[22px] border border-orange-100 bg-orange-50/40 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Tiện nghi</h2>
            {amenitiesError && <p className="mt-2 text-xs text-red-500">{amenitiesError}</p>}
            {amenities.length === 0 && !amenitiesError ? (
              <p className="mt-2 text-xs text-slate-400">Đang tải tiện nghi...</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {amenities.map((amenity) => (
                  <label key={amenity.id} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-orange-300 transition">
                    <input
                      type="checkbox"
                      checked={selectedAmenityIds.includes(amenity.id)}
                      onChange={() => toggleAmenity(amenity.id)}
                      className="h-4 w-4 rounded border-orange-200 accent-orange-500"
                    />
                    {amenity.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 rounded-[22px] border border-orange-100 bg-orange-50/40 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Thêm hình ảnh</h2>
            <p className="mt-2 text-xs text-slate-500">Tối đa 20 ảnh, định dạng JPG/PNG.</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(event) => handleImagesChange(event.target.files)}
              className="mt-3 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
            />

            {imagePreviews.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {imagePreviews.map((preview, index) => (
                  <div
                    key={`${preview}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-orange-100 bg-white"
                  >
                    <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImagePreview(index)}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </UserShell>
  );
}
