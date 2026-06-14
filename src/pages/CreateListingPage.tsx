import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMyListingDraft, uploadListingImages } from "../api/services/listings";
import { fetchAmenities, type Amenity } from "../api/services/amenities";
import { fetchProfile, updateProfile } from "../api/services/user";
import UserShell from "../layouts/UserShell";
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
    const wards = WARD_OPTIONS[form.district] || [];
    if (wards.length > 0 && !wards.includes(form.ward)) {
      setForm((prev) => ({ ...prev, ward: wards[0] }));
    }
  }, [form.district, form.ward]);

  useEffect(() => {
    let isMounted = true;
    fetchAmenities()
      .then((data) => {
        if (!isMounted) return;
        setAmenities(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setAmenitiesError("Khong the tai danh sach tien nghi.");
      });
    return () => {
      isMounted = false;
    };
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
      .catch(() => {
        // Ignore profile prefill failures; listing form can still be used.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImagesChange = (files: FileList | null) => {
    if (!files) {
      setImageFiles([]);
      setImagePreviews([]);
      return;
    }
    setImageFiles((prevFiles) => {
      const merged = [...prevFiles, ...Array.from(files)];
      if (merged.length > MAX_LISTING_IMAGES) {
        setError(`Bạn chỉ có thể thêm tối đa ${MAX_LISTING_IMAGES} ảnh.`);
      }
      const limited = merged.slice(0, MAX_LISTING_IMAGES);
      setImagePreviews(limited.map((file) => URL.createObjectURL(file)));
      return limited;
    });
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  const handleRemoveImagePreview = (indexToRemove: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setError("");

    if (!form.title || !form.description || !form.rentPrice || !form.city || !form.district || !form.ward) {
      setError("Vui lòng nhập đầy đủ tiêu đề, mô tả, giá và khu vực.");
      return;
    }

    const rentPrice = parseCurrencyInput(form.rentPrice);
    if (Number.isNaN(rentPrice) || rentPrice <= 0) {
      setError("Giá thuê không hợp lệ.");
      return;
    }

    if (form.phoneNumber && !/^(\+?\d[\d\s.-]{7,20})$/.test(form.phoneNumber)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    const roomAreaSqm = form.roomAreaSqm ? Number(form.roomAreaSqm) : null;
    if (roomAreaSqm !== null && (Number.isNaN(roomAreaSqm) || roomAreaSqm <= 0)) {
      setError("Diện tích phòng không hợp lệ.");
      return;
    }

    try {
      const listing = await createMyListingDraft({
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
        await uploadListingImages(listing.id, imageFiles);
      }

      if (form.phoneNumber && userFullName) {
        await updateProfile({ fullName: userFullName, phoneNumber: form.phoneNumber }).catch(() => {});
      }

      setStatus("Tạo bài đăng thành công. Bài đang ở trạng thái bản nháp.");
      navigate(`/my-listings/${listing.id}`);
    } catch {
      setError("Không thể tạo bài đăng. Vui lòng thử lại.");
    }
  };

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[860px] rounded-[28px] border border-orange-100 bg-white p-8 shadow-[0_25px_80px_-40px_rgba(255,115,0,0.6)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Tạo bài đăng mới</h1>
            <p className="mt-1 text-sm text-slate-500">Bài đăng sẽ được lưu ở trạng thái bản nháp (DRAFT).</p>
          </div>
          <button
            onClick={() => navigate("/my-listings")}
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Xem danh sách
          </button>
        </div>

        {status && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{status}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

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
              placeholder="VD: 0901234567"
            />
            <p className="mt-1 text-xs text-slate-500">Tự động lấy từ hồ sơ cá nhân nếu bạn đã cập nhật trước đó.</p>
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

          <div className="md:col-span-2 rounded-[22px] border border-orange-100 bg-orange-50/40 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Hình ảnh phòng</h2>
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

          <div className="md:col-span-2 rounded-[22px] border border-orange-100 bg-orange-50/40 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Tiện nghi</h2>
            {amenitiesError ? (
              <p className="mt-2 text-xs text-red-500">{amenitiesError}</p>
            ) : amenities.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Chưa có tiện nghi nào.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {amenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenityIds.includes(amenity.id)}
                      onChange={() => toggleAmenity(amenity.id)}
                      className="h-4 w-4 rounded border-orange-200 text-orange-500"
                    />
                    {amenity.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
            >
              Lưu bản nháp
            </button>
          </div>
        </form>
      </div>
    </UserShell>
  );
}
