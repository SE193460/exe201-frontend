import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeDollarSign, BedSingle, Filter, MapPin, Search, UsersRound } from "lucide-react";
import { fetchPublicListings, resolveListingImageUrl } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import { fetchProfile } from "../api/services/user";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";

export default function PublicListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [districtInput, setDistrictInput] = useState("all");
  const [priceInput, setPriceInput] = useState("all");
  const [areaInput, setAreaInput] = useState("all");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedDistrict, setAppliedDistrict] = useState("all");
  const [appliedPrice, setAppliedPrice] = useState("all");
  const [appliedArea, setAppliedArea] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  const priceOptions = [
    { id: "all", label: "Tất cả" },
    { id: "under_1m", label: "Dưới 1 triệu" },
    { id: "1m_2m", label: "Từ 1 - 2 triệu" },
    { id: "2m_3m", label: "Từ 2 - 3 triệu" },
    { id: "3m_5m", label: "Từ 3 - 5 triệu" },
    { id: "5m_7m", label: "Từ 5 - 7 triệu" },
    { id: "7m_10m", label: "Từ 7 - 10 triệu" },
    { id: "10m_15m", label: "Từ 10 - 15 triệu" },
    { id: "over_15m", label: "Trên 15 triệu" },
  ];

  const areaOptions = [
    { id: "all", label: "Tất cả" },
    { id: "under_20", label: "Dưới 20 m2" },
    { id: "20_30", label: "Từ 20 - 30m2" },
    { id: "30_50", label: "Từ 30 - 50m2" },
    { id: "50_70", label: "Từ 50 - 70m2" },
    { id: "70_90", label: "Từ 70 - 90m2" },
    { id: "over_90", label: "Trên 90m2" },
  ];

  const districtOptions = useMemo(() => {
    const districts = Array.from(new Set(listings.map((item) => item.district).filter(Boolean)));
    return ["all", ...districts];
  }, [listings]);

  const matchPriceRange = (price: number, range: string) => {
    switch (range) {
      case "under_1m":
        return price < 1_000_000;
      case "1m_2m":
        return price >= 1_000_000 && price < 2_000_000;
      case "2m_3m":
        return price >= 2_000_000 && price < 3_000_000;
      case "3m_5m":
        return price >= 3_000_000 && price < 5_000_000;
      case "5m_7m":
        return price >= 5_000_000 && price < 7_000_000;
      case "7m_10m":
        return price >= 7_000_000 && price < 10_000_000;
      case "10m_15m":
        return price >= 10_000_000 && price < 15_000_000;
      case "over_15m":
        return price >= 15_000_000;
      default:
        return true;
    }
  };

  const matchAreaRange = (area: number | null | undefined, range: string) => {
    if (range === "all") return true;
    if (!area) return false;

    switch (range) {
      case "under_20":
        return area < 20;
      case "20_30":
        return area >= 20 && area < 30;
      case "30_50":
        return area >= 30 && area < 50;
      case "50_70":
        return area >= 50 && area < 70;
      case "70_90":
        return area >= 70 && area < 90;
      case "over_90":
        return area >= 90;
      default:
        return true;
    }
  };

  const handleApplyFilters = () => {
    setAppliedSearch(searchInput.trim());
    setAppliedDistrict(districtInput);
    setAppliedPrice(priceInput);
    setAppliedArea(areaInput);
    setPage(1);
  };

  // Handle Google OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const token = params.get("accessToken");
    const errorParam = params.get("error");

    if (success === "google" && token) {
      localStorage.setItem("access_token", token);
      fetchProfile()
        .then((profile) => {
          if (profile.roleName === "admin") {
            navigate("/admin/dashboard", { replace: true });
            return;
          }
          navigate("/", { replace: true });
        })
        .catch(() => navigate("/", { replace: true }));
      return;
    }

    if (errorParam) {
      setError(errorParam === "inactive" ? "Tài khoản đã bị vô hiệu hóa." : "Đăng nhập Google thất bại.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    fetchPublicListings()
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Không thể tải danh sách phòng ở ghép.");
        setLoading(false);
      });
  }, []);

  const filteredListings = listings.filter((item) => {
    const searchableText = `${item.title} ${item.description} ${item.city} ${item.district} ${item.ward} ${item.address}`.toLowerCase();
    const matchesSearch = searchableText.includes(appliedSearch.toLowerCase());
    const matchesDistrict = appliedDistrict === "all" ? true : item.district === appliedDistrict;
    const matchesPrice = matchPriceRange(item.rentPrice, appliedPrice);
    const matchesArea = matchAreaRange(item.roomAreaSqm, appliedArea);
    return matchesSearch && matchesDistrict && matchesPrice && matchesArea;
  });

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE);
  const pagedListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-6 pb-16 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              <BedSingle className="h-3.5 w-3.5" /> Danh sách phòng
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Phòng ở ghép nổi bật</h1>
            <p className="mt-1 text-sm text-slate-500">Khám phá các phòng ở ghép đã qua duyệt uy tín trên toàn quốc.</p>
          </div>
          <div className="w-full max-w-sm">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm khu vực, quận huyện, tên phòng..."
              className="w-full rounded-full border border-orange-100 bg-white px-5 py-2.5 text-sm shadow-sm outline-none focus:border-orange-300 transition-all"
            />
          </div>
        </header>

        {/* Filters */}
        <section className="bg-white rounded-3xl p-5 border border-orange-100 shadow-[0_15px_40px_-25px_rgba(255,115,0,0.25)]">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-orange-500" /> Bộ lọc tìm kiếm
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-semibold text-slate-600">
              Khu vực
              <select
                value={districtInput}
                onChange={(e) => setDistrictInput(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-orange-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-300"
              >
                {districtOptions.map((district) => (
                  <option key={district} value={district}>
                    {district === "all" ? "Tất cả" : district}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Giá
              <select
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-orange-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-300"
              >
                {priceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-600">
              Diện tích
              <select
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-orange-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-orange-300"
              >
                {areaOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff6a3d] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e65a2f]"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </button>
            </div>
          </div>
        </section>

        {loading && (
          <div className="flex h-64 items-center justify-center rounded-[24px] border border-orange-100 bg-white shadow-sm">
            <div className="text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></span>
              <p className="mt-2 text-sm text-slate-500 font-semibold">Đang tải danh sách phòng...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[24px] border border-red-100 bg-white px-6 py-6 text-center text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && filteredListings.length === 0 && (
          <div className="rounded-[24px] border border-orange-100 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
            ❌ Không tìm thấy phòng phù hợp với tìm kiếm của bạn.
          </div>
        )}

        {!loading && !error && filteredListings.length > 0 && (
          <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pagedListings.map((listing) => {
              const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
              const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
              return (
                <article
                  key={listing.id}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-[24px] border border-orange-100 bg-white shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(255,115,0,0.45)]"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-orange-50">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={listing.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-orange-300">
                        Chưa cập nhật hình ảnh
                      </div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-slate-900/75 backdrop-blur px-3 py-1 text-xs font-semibold text-white">
                      {listing.roomType || "Phòng ở ghép"}
                    </span>
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      <BadgeDollarSign className="h-3.5 w-3.5" />
                      {listing.rentPrice.toLocaleString("vi-VN")} đ/tháng
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-[#ff6a3d] transition">
                      {listing.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                      {listing.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-orange-500" />
                      <span className="line-clamp-1">{location || "Chưa cập nhật địa chỉ"}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-orange-50 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <UsersRound className="h-3.5 w-3.5 text-orange-500" />
                        {listing.currentOccupants || 0}/{listing.maxOccupants || 4} thành viên
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BedSingle className="h-3.5 w-3.5 text-orange-500" />
                        {listing.roomAreaSqm ? `${listing.roomAreaSqm} m²` : "Chưa rõ diện tích"}
                      </span>
                      <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-700">
                        {listing.preferredGender || "Mọi giới tính"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
