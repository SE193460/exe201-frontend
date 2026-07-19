import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, X, Sparkles, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { fetchPublicListings, resolveListingImageUrl } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import type { SoftFilterResult, RoommatePreferences } from "../api/services/lifestyle";
import { fetchProfile } from "../api/services/user";
import { fetchRoommatePreferences, updateRoommatePreferences, runSoftFilter } from "../api/services/lifestyle";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import { matchAreaRange, matchPriceRange, AREA_OPTIONS, PRICE_OPTIONS } from "./listingRangeOptions";
import { FILTER_LINEAR_OPTIONS, PREF_OPTIONS } from "./lifestyleOptions";
import { trackEvent } from "../api/services/analytics";
export default function PublicListingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const initialParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState(initialParams.get("area") || "all");
  const [price, setPrice] = useState(initialParams.get("price") || "all");
  const [area, setArea] = useState("all");
  const [searchLocation, setSearchLocation] = useState(initialParams.get("q") || "");
  const [genderFilter, setGenderFilter] = useState(initialParams.get("gender") || "all");
  const [interestFilter] = useState(initialParams.get("interest") || "all");
  
  const [page, setPage] = useState(1);
  const [softFilterResults, setSoftFilterResults] = useState<Record<string, SoftFilterResult>>({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [softFilterPrefs, setSoftFilterPrefs] = useState<RoommatePreferences>({});
  const [softFilterLoading, setSoftFilterLoading] = useState(false);
  const [softFilterSection, setSoftFilterSection] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const PAGE_SIZE = 9;

  const highlightListingId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("highlightListingId");
  }, [location.search]);

  const districtOptions = useMemo(() => {
    const districts = Array.from(new Set(listings.map((item) => item.district).filter(Boolean)));
    const all = ["all", ...districts];
    if (district !== "all" && !all.includes(district)) {
      all.splice(1, 0, district);
    }
    return all;
  }, [listings, district]);

  // Mapping để lấy label đầy đủ cho mỗi field
  const FIELD_FULL_LABELS: Record<string, string> = {
    cleanliness: t("Mức độ sạch sẽ"),
    ac_usage: t("Tần suất sử dụng điều hòa"),
    pet: t("Thú cưng"),
    smoking: t("Hút thuốc"),
    cooking: t("Nấu ăn"),
    guest: t("Tần suất dẫn bạn bè về phòng"),
    home_frequency: t("Tần suất ở trong phòng"),
    work_schedule: t("Thời gian làm việc"),
    sharing: t("Mức độ chia sẻ đồ dùng"),
    noise: t("Mức độ giữ yên tĩnh"),
    call_frequency: t("Tần suất gọi điện/video call"),
    game_mic: t("Mức độ chơi game voice chat"),
  };

  // Helper function để lấy label cho một giá trị field cụ thể
  const getFieldValueLabel = (field: string, value: string | number | null | undefined): string | null => {
    if (value === null || value === undefined || value === "") return null;

    try {
      // Các field numeric từ PROFILE_OPTIONS (profile data)
      const numericFields = ["cleanliness", "ac_usage", "cooking", "guest", "home_frequency", "noise", "call_frequency", "game_mic"];
      
      if (numericFields.includes(field)) {
        const numValue = typeof value === "string" ? parseInt(value, 10) : Number(value);
        
        // Try PROFILE_OPTIONS first (cho dữ liệu từ profile)
        const profileOptions: Record<string, Array<{ value: number; label: string }>> = {
          cleanliness: [
            { value: 1, label: t("Rất sạch: Dọn dẹp thường xuyên, khó chịu khi phòng bừa bộn") },
            { value: 2, label: t("Khá sạch: Giữ phòng gọn gàng, dọn dẹp định kỳ") },
            { value: 3, label: t("Bình thường: Dọn dẹp khi cần thiết, không quá khắt khe nhưng vẫn muốn không gian sạch sẽ") },
            { value: 4, label: t("Ít quan tâm: Không đặt nặng việc dọn dẹp thường xuyên, ưu tiên sự thoải mái trong sinh hoạt") },
          ],
          ac_usage: [
            { value: 1, label: t("Hầu như không dùng: Chỉ bật trong những ngày rất nóng") },
            { value: 2, label: t("Ít: Thỉnh thoảng bật khi cảm thấy nóng") },
            { value: 3, label: t("Bình thường: Bật khi thời tiết nóng hoặc lúc ngủ") },
            { value: 4, label: t("Nhiều: Bật thường xuyên khi ở trong phòng") },
            { value: 5, label: t("Gần như luôn bật: Bật gần như toàn bộ thời gian ở phòng") },
          ],
          cooking: [
            { value: 1, label: t("Thường xuyên") },
            { value: 2, label: t("Thỉnh thoảng") },
            { value: 3, label: t("Hiếm khi") },
          ],
          guest: [
            { value: 1, label: t("Hiếm khi: Chỉ trong những dịp đặc biệt.") },
            { value: 2, label: t("Thỉnh thoảng: Đôi khi có bạn bè ghé chơi hoặc trò chuyện.") },
            { value: 3, label: t("Thường xuyên: Khá thường xuyên có bạn bè tới phòng.") },
          ],
          home_frequency: [
            { value: 3, label: t("Thường xuyên: Dành phần lớn thời gian trong ngày ở phòng") },
            { value: 2, label: t("Bình thường") },
            { value: 1, label: t("Ít: Phần lớn thời gian trong ngày ở bên ngoài") },
          ],
          noise: [
            { value: 1, label: t("Yên tĩnh: Thường đeo tai nghe, hạn chế tạo tiếng ồn ảnh hưởng tới người khác.") },
            { value: 2, label: t("Bình thường: Có tạo tiếng ồn trong sinh hoạt nhưng ở mức hợp lý.") },
            { value: 3, label: t("Khá ồn ào: Thường xuyên mở loa ngoài, hát, chơi nhạc hoặc tạo tiếng ồn trong phòng.") },
          ],
          call_frequency: [
            { value: 1, label: t("Hiếm khi") },
            { value: 2, label: t("Thỉnh thoảng") },
            { value: 3, label: t("Khá thường xuyên") },
            { value: 4, label: t("Thường xuyên") },
          ],
          game_mic: [
            { value: 1, label: t("Hầu như không: Ít hoặc không chơi game có sử dụng mic") },
            { value: 2, label: t("Thỉnh thoảng: Đôi khi chơi game có sử dụng mic hoặc voice chat") },
            { value: 3, label: t("Khá thường xuyên: Chơi game có sử dụng mic tương đối đều đặn") },
            { value: 4, label: t("Thường xuyên: Dành khá nhiều thời gian chơi game có sử dụng mic hoặc voice chat") },
          ],
        };
        
        if (profileOptions[field]) {
          const option = profileOptions[field].find(opt => opt.value === numValue);
          if (option) return option.label;
        }
      }

      // Các field text từ PROFILE_OPTIONS
      const textProfileOptions: Record<string, Array<{ value: string | number; label: string }>> = {
        pet: [
          { value: 0, label: t("Không nuôi thú cưng") },
          { value: 1, label: t("Có nuôi thú cưng") },
        ],
        smoking: [
          { value: 0, label: t("Không hút thuốc") },
          { value: 1, label: t("Có hút thuốc") },
        ],
        work_schedule: [
          { value: "DAY", label: t("Chủ yếu ban ngày: Học tập hoặc làm việc chủ yếu vào ban ngày") },
          { value: "FLEXIBLE", label: t("Không cố định: Lịch sinh hoạt thay đổi hoặc không cố định") },
          { value: "NIGHT", label: t("Chủ yếu ban đêm: Học tập hoặc làm việc chủ yếu vào buổi tối hoặc ban đêm") },
        ],
        sharing: [
          { value: 1, label: t("Thoải mái: Không quá để ý việc roommate sử dụng các đồ dùng chung hoặc mượn những vật dụng nhỏ.") },
          { value: 2, label: t("Hỏi trước: Thoải mái chia sẻ nhưng muốn được hỏi hoặc báo trước.") },
          { value: 3, label: t("Không thích: Ưu tiên sử dụng đồ dùng riêng, không thích việc dùng chung đồ cá nhân.") },
        ],
      };

      if (textProfileOptions[field]) {
        const option = textProfileOptions[field].find(opt => opt.value.toString() === value.toString());
        if (option) return option.label;
      }
    } catch (e) {
      console.error(`Lỗi khi lấy label cho field ${field} với value ${value}:`, e);
    }

    // Fallback: nếu API đã trả về label string trực tiếp, hiển thị luôn
    if (typeof value === "string" && value.trim() !== "") return value;
    if (typeof value === "number") return value.toString();

    return null;
  };

  // Lấy tất cả lifestyle preferences của một result
  const getAllLifestylePrefs = (result: SoftFilterResult | undefined) => {
    if (!result?.field_scores) return [];
    
    // Định thứ tự hiển thị
    const fieldOrder = [
      "cleanliness",
      "ac_usage",
      "pet",
      "smoking",
      "cooking",
      "guest",
      "home_frequency",
      "work_schedule",
      "sharing",
      "noise",
      "call_frequency",
      "game_mic",
    ];
    
    const prefs: Array<{ field: string; value: any; label: string }> = [];
    
    for (const field of fieldOrder) {
      const data = result.field_scores[field];
      // Only include fields that have a good score (>= 0.75)
      if (data && typeof data.score === "number" && data.score >= 0.75 && data.profile_value !== null && data.profile_value !== undefined) {
        const label = getFieldValueLabel(field, data.profile_value);
        if (label) {
          prefs.push({
            field,
            value: data.profile_value,
            label,
          });
        }
      }
    }
    
    return prefs;
  };

  const setPrefNumber = (field: keyof RoommatePreferences, value: string) => {
    setSoftFilterPrefs((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const setPrefText = (field: keyof RoommatePreferences, value: string) => {
    setSoftFilterPrefs((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const loadSoftFilterPrefs = async () => {
    try {
      const prefs = await fetchRoommatePreferences();
      setSoftFilterPrefs(prefs || {});
    } catch (e) {
      console.error("Lỗi khi tải soft filter preferences:", e);
    }
  };

  const submitSoftFilterForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setSoftFilterLoading(true);
    try {
      // Cập nhật preferences
      await updateRoommatePreferences(softFilterPrefs);

      // Chạy soft filter
      await trackEvent({
        eventName: "listing_filter_applied",
        metadata: {
          source: "soft_filter",
        },
      });

      const response = await runSoftFilter({
        user_type: "NO_ROOM",
        hard_filters: {
          district: null,
          min_price: null,
          max_price: null,
          min_area: null,
          max_area: null,
        },
      });

      const resultsData = response.results || [];
      const resultsMap = resultsData.reduce(
        (acc, result) => {
          acc[result.id] = result;
          return acc;
        },
        {} as Record<string, SoftFilterResult>
      );
      setSoftFilterResults(resultsMap);
      localStorage.setItem("softFilterResults", JSON.stringify(resultsData));
      window.dispatchEvent(new CustomEvent("softFilterUpdated", { detail: resultsData }));
      setIsDropdownOpen(false);
    } catch (e) {
      console.error("Lỗi khi áp dụng bộ lọc mềm:", e);
    } finally {
      setSoftFilterLoading(false);
    }
  };

  // Load soft filter prefs khi dropdown mở
  useEffect(() => {
    if (isDropdownOpen && Object.keys(softFilterPrefs).length === 0) {
      loadSoftFilterPrefs();
    }
  }, [isDropdownOpen]);
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
      setError(errorParam === "inactive" ? t("Tài khoản đã bị vô hiệu hóa.") : t("Đăng nhập Google thất bại."));
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
        setError(t("Không thể tải danh sách phòng ở ghép."));
        setLoading(false);
      });

    // Tải soft filter results từ localStorage
    try {
      const savedResults = localStorage.getItem("softFilterResults");
      if (savedResults) {
        const results: SoftFilterResult[] = JSON.parse(savedResults);
        const resultsMap = results.reduce(
          (acc, result) => {
            acc[result.id] = result;
            return acc;
          },
          {} as Record<string, SoftFilterResult>
        );
        setSoftFilterResults(resultsMap);
      }
    } catch (e) {
      console.error("Lỗi khi tải soft filter results:", e);
    }
  }, []);

  const filteredListings = (() => {
    const normalizeStr = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");

    const filtered = listings.filter((item) => {
      const matchesDistrict = district === "all" ? true : normalizeStr(item.district || "").includes(normalizeStr(district));
      const matchesPrice = matchPriceRange(item.rentPrice, price);
      const matchesArea = matchAreaRange(item.roomAreaSqm, area);
      const locationStr = [item.ward, item.district, item.city].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchLocation.trim()
        ? locationStr.includes(searchLocation.trim().toLowerCase()) ||
          (item.title || "").toLowerCase().includes(searchLocation.trim().toLowerCase()) ||
          (item.description || "").toLowerCase().includes(searchLocation.trim().toLowerCase())
        : true;
      const matchesGender = genderFilter === "all" ? true : (() => {
        const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const listingGender = norm(item.preferredGender || "");
        const filterVal = norm(genderFilter);
        if (filterVal === "FEMALE") return listingGender.includes("NU") || listingGender.includes("FEMALE") || listingGender.includes("NỮ");
        if (filterVal === "MALE") return listingGender.includes("NAM") || listingGender.includes("MALE");
        return listingGender.includes("KHONG YEU CAU") || listingGender.includes("BAT KY") || listingGender.includes("ANY") || listingGender === "";
      })();
      const matchesInterest = interestFilter === "all" ? true : (
        interestFilter === "clean" ? (item.amenities?.some((a) => a.name.toLowerCase().includes("sạch")) || false) :
        interestFilter === "quiet" ? (item.amenities?.some((a) => a.name.toLowerCase().includes("yên tĩnh")) || false) :
        interestFilter === "pet" ? (item.petAllowed === true) :
        interestFilter === "cooking" ? (item.amenities?.some((a) => a.name.toLowerCase().includes("nấu ăn")) || false) :
        interestFilter === "social" ? true :
        true
      );
      return matchesDistrict && matchesPrice && matchesArea && matchesSearch && matchesGender && matchesInterest;
    });

    // Tách thành 2 nhóm: user created (source = null) và imported (source != null)
    const userCreated = filtered.filter((item) => !item.source);
    const imported = filtered.filter((item) => item.source);

    // Sắp xếp mỗi nhóm theo publishedAt từ mới nhất (DESC)
    const sortByPublishedAtDesc = (a: Listing, b: Listing) => {
      const dateA = new Date(a.publishedAt || a.createdAt).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt).getTime();
      return dateB - dateA;
    };

    userCreated.sort(sortByPublishedAtDesc);
    imported.sort(sortByPublishedAtDesc);

    // Nối: user created trước, imported sau
    return [...userCreated, ...imported];
  })();

  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE);
  const pagedListings = filteredListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (!highlightListingId || listings.length === 0) return;
    const targetIndex = listings.findIndex((item) => item.id === highlightListingId);
    if (targetIndex >= 0) {
      const targetPage = Math.floor(targetIndex / PAGE_SIZE) + 1;
      setPage(targetPage);
    }
  }, [highlightListingId, listings]);

  useEffect(() => {
    if (!highlightListingId) return;
    const timer = window.setTimeout(() => {
      const element = document.querySelector(`[data-listing-id="${highlightListingId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [highlightListingId, pagedListings]);

  // Lắng nghe khi user update soft filter ở trang /soft-filter
  useEffect(() => {
    const handleSoftFilterUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SoftFilterResult[]>;
      const results = customEvent.detail;
      const resultsMap = results.reduce(
        (acc, result) => {
          acc[result.id] = result;
          return acc;
        },
        {} as Record<string, SoftFilterResult>
      );
      setSoftFilterResults(resultsMap);
    };

    // Listener cho custom event
    window.addEventListener("softFilterUpdated", handleSoftFilterUpdated);

    // Listener cho page visibility change (khi user back từ soft filter page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Trang chủ được focus lại, reload soft filter results từ localStorage
        try {
          const savedResults = localStorage.getItem("softFilterResults");
          if (savedResults) {
            const results: SoftFilterResult[] = JSON.parse(savedResults);
            const resultsMap = results.reduce(
              (acc, result) => {
                acc[result.id] = result;
                return acc;
              },
              {} as Record<string, SoftFilterResult>
            );
            setSoftFilterResults(resultsMap);
          }
        } catch (e) {
          console.error("Lỗi khi tải soft filter results:", e);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("softFilterUpdated", handleSoftFilterUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 md:px-6 pb-16 pt-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--on-surface)] md:text-3xl" style={{ fontFamily: "var(--font-main)" }}>
              {t("Danh sách phòng trọ")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? t("Đang tải...") : t("Tìm thấy {{count}} phòng phù hợp.", { count: filteredListings.length })}
            </p>
          </div>
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setSoftFilterSection(1);
            }}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            {t("Bộ lọc mềm")}
          </button>
        </header>

        {/* Filters */}
        <div className="relative">
          <section className="bg-white rounded-[var(--radius-md)] p-4 border border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder={t("Tìm kiếm theo địa chỉ")}
                  className="bg-transparent outline-none text-sm w-40 md:w-48"
                />
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-[var(--primary)]" />
                <select
                  value={district}
                  onChange={(e) => {
                    const nextDistrict = e.target.value;
                    setDistrict(nextDistrict);
                    setPage(1);
                    trackEvent({
                      eventName: "listing_filter_applied",
                      district: nextDistrict === "all" ? null : nextDistrict,
                      metadata: { filterType: "district", value: nextDistrict },
                    });
                  }}
                  className="bg-transparent outline-none text-sm"
                >
                    {districtOptions.map((d) => (
                    <option key={d} value={d}>{d === "all" ? t("Tất cả") : d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="text-sm text-slate-500">{t("Giá")}</span>
                <select
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setPage(1); }}
                  className="bg-transparent outline-none text-sm"
                >
                  {PRICE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="text-sm text-slate-500">{t("Diện tích")}</span>
                <select
                  value={area}
                  onChange={(e) => { setArea(e.target.value); setPage(1); }}
                  className="bg-transparent outline-none text-sm"
                >
                  {AREA_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="text-sm text-slate-500">{t("Giới tính")}</span>
                <select
                  value={genderFilter}
                  onChange={(e) => { setGenderFilter(e.target.value); setPage(1); }}
                  className="bg-transparent outline-none text-sm"
                >
                  <option value="all">{t("Tất cả")}</option>
                  <option value="FEMALE">{t("Nữ")}</option>
                  <option value="MALE">{t("Nam")}</option>
                  <option value="ANY">{t("Nam/Nữ")}</option>
                </select>
              </div>

              <div className="ml-auto">
                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  <MapPin className="h-4 w-4 text-[var(--primary)]" /> {t("Xem bản đồ")}
                </button>
              </div>
            </div>
          </section>

          {/* Soft Filter Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[var(--radius-md)] border border-slate-200 shadow-lg z-50 overflow-hidden">
              <div className="bg-[var(--primary)] px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-main)" }}>{t("Bộ lọc mềm")}</h3>
                      <p className="text-xs text-white/80 mt-1">{t("Chọn sở thích để lọc phù hợp với bạn")}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {[1,2,3].map((s) => (
                        <div key={s} className={`flex items-center gap-2 ${s < 3 ? "pr-2" : ""}`}>
                          <div className={`h-3 w-3 rounded-full ${softFilterSection === s ? "bg-white" : "bg-white/40"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => setIsDropdownOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={submitSoftFilterForm} className="p-6">
                {softFilterSection === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Bạn mong muốn roommate có mức độ sạch sẽ như thế nào?")}</div>
                      <select value={softFilterPrefs.pref_cleanliness ?? ""} onChange={(e) => setPrefNumber("pref_cleanliness", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.cleanliness.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Tần suất sử dụng điều hòa mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_ac_usage ?? ""} onChange={(e) => setPrefNumber("pref_ac_usage", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.ac_usage.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Bạn có muốn roommate nuôi thú cưng không?")}</div>
                      <select value={softFilterPrefs.pref_pet ?? ""} onChange={(e) => setPrefText("pref_pet", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {PREF_OPTIONS.pet.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Bạn có muốn roommate hút thuốc không?")}</div>
                      <select value={softFilterPrefs.pref_smoking ?? ""} onChange={(e) => setPrefText("pref_smoking", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {PREF_OPTIONS.smoking.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                      </select>
                    </label>
                  </div>
                )}

                {softFilterSection === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Bạn mong muốn roommate nấu ăn ở mức nào?")}</div>
                      <select value={softFilterPrefs.pref_cooking ?? ""} onChange={(e) => setPrefNumber("pref_cooking", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.cooking.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Tần suất dẫn bạn bè về phòng mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_guest ?? ""} onChange={(e) => setPrefNumber("pref_guest", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.guest.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Tần suất ở trong phòng mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_home_frequency ?? ""} onChange={(e) => setPrefNumber("pref_home_frequency", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.home_frequency.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Thời gian làm việc mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_work_schedule ?? ""} onChange={(e) => setPrefText("pref_work_schedule", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {PREF_OPTIONS.work_schedule.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                      </select>
                    </label>
                  </div>
                )}

                {softFilterSection === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Mức độ chia sẻ đồ dùng mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_sharing ?? ""} onChange={(e) => setPrefText("pref_sharing", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {PREF_OPTIONS.sharing.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Mức độ giữ yên tĩnh trong không gian chung mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_noise ?? ""} onChange={(e) => setPrefNumber("pref_noise", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.noise.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Mức độ gọi điện/video call mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_call_frequency ?? ""} onChange={(e) => setPrefNumber("pref_call_frequency", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.call_frequency.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                    <label className="block bg-white rounded-[var(--radius-md)] border border-slate-200 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">{t("Mức độ chơi game có sử dụng mic hoặc voice chat mong muốn của roommate")}</div>
                      <select value={softFilterPrefs.pref_game_mic ?? ""} onChange={(e) => setPrefNumber("pref_game_mic", e.target.value)}
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary)] transition">
                        <option value="">{t("Bỏ trống")}</option>
                        {FILTER_LINEAR_OPTIONS.game_mic.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                  </div>
                )}

                <div className="flex gap-2 mt-6 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setSoftFilterSection(Math.max(1, softFilterSection - 1))} disabled={softFilterSection === 1}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft className="h-4 w-4" /> {t("Trước")}
                  </button>
                  <button type="button" onClick={() => setSoftFilterSection(Math.min(3, softFilterSection + 1))} disabled={softFilterSection === 3}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary-container)] px-4 py-2.5 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/70 transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {t("Tiếp")} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <button type="submit" disabled={softFilterLoading}
                  className="w-full mt-3 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  {softFilterLoading ? t("Đang xử lý...") : t("Áp dụng bộ lọc")}
                </button>
              </form>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex h-60 items-center justify-center rounded-[var(--radius-md)] border border-slate-200 bg-white">
            <span className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-[var(--radius-md)] border border-red-100 bg-white px-6 py-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {isMapModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[var(--radius-md)] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{t("Bản đồ khu vực")}</h2>
                  <p className="text-sm text-slate-500">{t("Xem vị trí trên bản đồ")}</p>
                </div>
                <button onClick={() => setIsMapModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-[16/9] bg-slate-100">
                <iframe title={t("Bản đồ")} src="https://maps.google.com/maps?q=Thủ+Đức&output=embed" className="h-full w-full border-0" allowFullScreen loading="lazy" />
              </div>
            </div>
          </div>
        )}

        {!loading && !error && filteredListings.length === 0 && (
          <div className="rounded-[var(--radius-md)] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary-container)]">
              <Search className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <p className="mt-4 text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
              {t("Không tìm thấy phòng phù hợp")}
            </p>
            <p className="mt-1 text-sm text-slate-500">{t("Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.")}</p>
          </div>
        )}

        {!loading && !error && filteredListings.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pagedListings.map((listing) => {
                const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
                const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
                const badge = listing.preferredGender === "FEMALE" ? { text: t("Nữ ở ghép"), color: "bg-amber-600" }
                  : listing.preferredGender === "MALE" ? { text: t("Nam ở ghép"), color: "bg-amber-600" }
                  : listing.preferredGender === "ANY" ? { text: t("Nam/Nữ"), color: "bg-amber-600" }
                  : { text: t("Tìm người ở ghép"), color: "bg-amber-600" };

                return (
                  <article
                    key={listing.id}
                    data-listing-id={listing.id}
                    onClick={() => {
                      trackEvent({ eventName: "listing_card_click", listingId: listing.id, district: listing.district || null, source: softFilterResults[listing.id] ? "recommended" : "normal" });
                      navigate(`/listings/${listing.id}`);
                    }}
                    className={`group cursor-pointer overflow-hidden rounded-[var(--radius-md)] border bg-white transition hover:-translate-y-0.5 hover:shadow-lg ${highlightListingId === listing.id ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "border-slate-200"}`}
                  >
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      {thumbnail ? (
                        <img src={thumbnail} alt={listing.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">{t("Chưa có ảnh")}</div>
                      )}
                      <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold text-white ${badge.color}`}>
                        {badge.text}
                      </span>
                      {listing.promoExpiresAt && new Date(listing.promoExpiresAt) > new Date() && (
                        <span className="absolute top-3 right-3 rounded-full bg-red-500/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> VIP
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-base font-bold text-[var(--on-surface)] line-clamp-1" style={{ fontFamily: "var(--font-main)" }}>
                        {listing.title}
                      </h3>
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3 flex-shrink-0 text-[var(--primary)]" />
                        {location || t("Chưa cập nhật")}
                      </p>

                      {softFilterResults[listing.id] && getAllLifestylePrefs(softFilterResults[listing.id]).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {getAllLifestylePrefs(softFilterResults[listing.id]).slice(0, 2).map((pref) => (
                            <span key={pref.field} className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                              {FIELD_FULL_LABELS[pref.field] || pref.field}: {pref.label}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-3">
                        <p className="text-base font-extrabold text-[var(--primary)]">
                          {listing.rentPrice >= 1000000
                            ? `${(listing.rentPrice / 1000000).toFixed(listing.rentPrice % 1000000 === 0 ? 0 : 1)}Tr`
                            : listing.rentPrice.toLocaleString("vi-VN")}
                          <span className="text-xs font-medium text-slate-400">{t("đ/tháng")}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          {softFilterResults[listing.id] && (
                            <span className="text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-container)] rounded-full px-2 py-0.5">
                              {Math.round(softFilterResults[listing.id].total_score)}%
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[var(--primary)] transition group-hover:underline">
                            {t("Chi tiết")}
                          </span>
                        </div>
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
