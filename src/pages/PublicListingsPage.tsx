import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BadgeDollarSign, MapPin, X, Sparkles, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
export default function PublicListingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("all");
  const [price, setPrice] = useState("all");
  const [area, setArea] = useState("all");
  const [searchLocation, setSearchLocation] = useState("");
  
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
    return ["all", ...districts];
  }, [listings]);

  // Mapping để lấy label đầy đủ cho mỗi field
  const FIELD_FULL_LABELS: Record<string, string> = {
    cleanliness: "Mức độ sạch sẽ",
    ac_usage: "Tần suất sử dụng điều hòa",
    pet: "Thú cưng",
    smoking: "Hút thuốc",
    cooking: "Nấu ăn",
    guest: "Tần suất dẫn bạn bè về phòng",
    home_frequency: "Tần suất ở trong phòng",
    work_schedule: "Thời gian làm việc",
    sharing: "Mức độ chia sẻ đồ dùng",
    noise: "Mức độ giữ yên tĩnh",
    call_frequency: "Tần suất gọi điện/video call",
    game_mic: "Mức độ chơi game voice chat",
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
            { value: 1, label: "Rất sạch: Dọn dẹp thường xuyên, khó chịu khi phòng bừa bộn" },
            { value: 2, label: "Khá sạch: Giữ phòng gọn gàng, dọn dẹp định kỳ" },
            { value: 3, label: "Bình thường: Dọn dẹp khi cần thiết, không quá khắt khe nhưng vẫn muốn không gian sạch sẽ" },
            { value: 4, label: "Ít quan tâm: Không đặt nặng việc dọn dẹp thường xuyên, ưu tiên sự thoải mái trong sinh hoạt" },
          ],
          ac_usage: [
            { value: 1, label: "Hầu như không dùng: Chỉ bật trong những ngày rất nóng" },
            { value: 2, label: "Ít: Thỉnh thoảng bật khi cảm thấy nóng" },
            { value: 3, label: "Bình thường: Bật khi thời tiết nóng hoặc lúc ngủ" },
            { value: 4, label: "Nhiều: Bật thường xuyên khi ở trong phòng" },
            { value: 5, label: "Gần như luôn bật: Bật gần như toàn bộ thời gian ở phòng" },
          ],
          cooking: [
            { value: 1, label: "Thường xuyên" },
            { value: 2, label: "Thỉnh thoảng" },
            { value: 3, label: "Hiếm khi" },
          ],
          guest: [
            { value: 1, label: "Hiếm khi: Chỉ trong những dịp đặc biệt." },
            { value: 2, label: "Thỉnh thoảng: Đôi khi có bạn bè ghé chơi hoặc trò chuyện." },
            { value: 3, label: "Thường xuyên: Khá thường xuyên có bạn bè tới phòng." },
          ],
          home_frequency: [
            { value: 3, label: "Thường xuyên: Dành phần lớn thời gian trong ngày ở phòng" },
            { value: 2, label: "Bình thường" },
            { value: 1, label: "Ít: Phần lớn thời gian trong ngày ở bên ngoài" },
          ],
          noise: [
            { value: 1, label: "Yên tĩnh: Thường đeo tai nghe, hạn chế tạo tiếng ồn ảnh hưởng tới người khác." },
            { value: 2, label: "Bình thường: Có tạo tiếng ồn trong sinh hoạt nhưng ở mức hợp lý." },
            { value: 3, label: "Khá ồn ào: Thường xuyên mở loa ngoài, hát, chơi nhạc hoặc tạo tiếng ồn trong phòng." },
          ],
          call_frequency: [
            { value: 1, label: "Hiếm khi" },
            { value: 2, label: "Thỉnh thoảng" },
            { value: 3, label: "Khá thường xuyên" },
            { value: 4, label: "Thường xuyên" },
          ],
          game_mic: [
            { value: 1, label: "Hầu như không: Ít hoặc không chơi game có sử dụng mic" },
            { value: 2, label: "Thỉnh thoảng: Đôi khi chơi game có sử dụng mic hoặc voice chat" },
            { value: 3, label: "Khá thường xuyên: Chơi game có sử dụng mic tương đối đều đặn" },
            { value: 4, label: "Thường xuyên: Dành khá nhiều thời gian chơi game có sử dụng mic hoặc voice chat" },
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
          { value: 0, label: "Không nuôi thú cưng" },
          { value: 1, label: "Có nuôi thú cưng" },
        ],
        smoking: [
          { value: 0, label: "Không hút thuốc" },
          { value: 1, label: "Có hút thuốc" },
        ],
        work_schedule: [
          { value: "DAY", label: "Chủ yếu ban ngày: Học tập hoặc làm việc chủ yếu vào ban ngày" },
          { value: "FLEXIBLE", label: "Không cố định: Lịch sinh hoạt thay đổi hoặc không cố định" },
          { value: "NIGHT", label: "Chủ yếu ban đêm: Học tập hoặc làm việc chủ yếu vào buổi tối hoặc ban đêm" },
        ],
        sharing: [
          { value: 1, label: "Thoải mái: Không quá để ý việc roommate sử dụng các đồ dùng chung hoặc mượn những vật dụng nhỏ." },
          { value: 2, label: "Hỏi trước: Thoải mái chia sẻ nhưng muốn được hỏi hoặc báo trước." },
          { value: 3, label: "Không thích: Ưu tiên sử dụng đồ dùng riêng, không thích việc dùng chung đồ cá nhân." },
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
    const filtered = listings.filter((item) => {
      const matchesDistrict = district === "all" ? true : item.district === district;
      const matchesPrice = matchPriceRange(item.rentPrice, price);
      const matchesArea = matchAreaRange(item.roomAreaSqm, area);
      const locationStr = [item.ward, item.district, item.city].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchLocation.trim() ? locationStr.includes(searchLocation.trim().toLowerCase()) : true;
      return matchesDistrict && matchesPrice && matchesArea && matchesSearch;
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
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-8 px-6 pb-16 pt-10">
        {/* Header removed as requested */}

        {/* Filters */}
        <div className="relative">
          <section className="bg-white rounded-3xl p-5 border border-orange-100 shadow-[0_15px_40px_-25px_rgba(255,115,0,0.25)]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setSoftFilterSection(1);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-orange-500" /> Filters
              </button>

              <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Tìm kiếm theo địa chỉ"
                  className="bg-transparent outline-none text-sm w-48"
                />
              </div>

              <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 text-orange-500" />
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent outline-none text-sm"
                >
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>
                      {d === "all" ? "Tất cả" : d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm">
                <span className="text-orange-500">$</span>
                <select
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent outline-none text-sm"
                >
                  {PRICE_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm">
                <span className="text-slate-500">Diện tích</span>
                <select
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent outline-none text-sm"
                >
                  {AREA_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-2 text-sm hover:shadow-sm"
                >
                  <MapPin className="h-4 w-4 text-orange-500" /> Xem bản đồ
                </button>
              </div>
            </div>
          </section>

          {/* Soft Filter Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl border border-orange-100 shadow-[0_20px_60px_-20px_rgba(255,115,0,0.35)] z-50 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Bộ lọc mềm</h3>
                      <p className="text-xs text-orange-50 mt-1">Chọn sở thích để lọc phù hợp với bạn</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      {[1,2,3].map((s) => (
                        <div key={s} className={`flex items-center gap-2 ${s < 3 ? "pr-2" : ""}`}>
                          <div className={`h-3 w-3 rounded-full ${softFilterSection === s ? "bg-white" : "bg-white/40"}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>
              </div>

              <form onSubmit={submitSoftFilterForm} className="p-6">
                {/* Section 1: Sinh hoạt cơ bản */}
                {softFilterSection === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Bạn mong muốn roommate có mức độ sạch sẽ như thế nào?</div>
                      <select
                        value={softFilterPrefs.pref_cleanliness ?? ""}
                        onChange={(e) => setPrefNumber("pref_cleanliness", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.cleanliness.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Tần suất sử dụng điều hòa mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_ac_usage ?? ""}
                        onChange={(e) => setPrefNumber("pref_ac_usage", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.ac_usage.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Bạn có muốn roommate nuôi thú cưng không?</div>
                      <select
                        value={softFilterPrefs.pref_pet ?? ""}
                        onChange={(e) => setPrefText("pref_pet", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {PREF_OPTIONS.pet.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Bạn có muốn roommate hút thuốc không?</div>
                      <select
                        value={softFilterPrefs.pref_smoking ?? ""}
                        onChange={(e) => setPrefText("pref_smoking", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {PREF_OPTIONS.smoking.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {/* Section 2: Thói quen ở phòng */}
                {softFilterSection === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Bạn mong muốn roommate nấu ăn ở mức nào?</div>
                      <select
                        value={softFilterPrefs.pref_cooking ?? ""}
                        onChange={(e) => setPrefNumber("pref_cooking", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.cooking.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Tần suất dẫn bạn bè về phòng mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_guest ?? ""}
                        onChange={(e) => setPrefNumber("pref_guest", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.guest.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Tần suất ở trong phòng mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_home_frequency ?? ""}
                        onChange={(e) => setPrefNumber("pref_home_frequency", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.home_frequency.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Thời gian làm việc mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_work_schedule ?? ""}
                        onChange={(e) => setPrefText("pref_work_schedule", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {PREF_OPTIONS.work_schedule.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {/* Section 3: Môi trường sống chung */}
                {softFilterSection === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Mức độ chia sẻ đồ dùng mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_sharing ?? ""}
                        onChange={(e) => setPrefText("pref_sharing", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {PREF_OPTIONS.sharing.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Mức độ giữ yên tĩnh trong không gian chung mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_noise ?? ""}
                        onChange={(e) => setPrefNumber("pref_noise", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.noise.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Mức độ gọi điện/video call mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_call_frequency ?? ""}
                        onChange={(e) => setPrefNumber("pref_call_frequency", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.call_frequency.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>

                    <label className="block bg-white rounded-xl border border-orange-50 p-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Mức độ chơi game có sử dụng mic hoặc voice chat mong muốn của roommate</div>
                      <select
                        value={softFilterPrefs.pref_game_mic ?? ""}
                        onChange={(e) => setPrefNumber("pref_game_mic", e.target.value)}
                        className="w-full rounded-md border border-orange-100 bg-white px-3 py-2 text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition"
                      >
                        <option value="">Bỏ trống</option>
                        {FILTER_LINEAR_OPTIONS.game_mic.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        <option value="99">{PREF_OPTIONS.intAny.label}</option>
                      </select>
                    </label>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-orange-100">
                  <button
                    type="button"
                    onClick={() => setSoftFilterSection(Math.max(1, softFilterSection - 1))}
                    disabled={softFilterSection === 1}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" /> Trước
                  </button>

                  <button
                    type="button"
                    onClick={() => setSoftFilterSection(Math.min(3, softFilterSection + 1))}
                    disabled={softFilterSection === 3}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-100 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tiếp <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={softFilterLoading}
                  className="w-full mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {softFilterLoading ? "Đang xử lý..." : "Áp dụng bộ lọc"}
                </button>
              </form>
            </div>
          )}
        </div>

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

        {isMapModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Bản đồ Thủ Đức</h2>
                  <p className="text-sm text-slate-500">Xem vị trí Thủ Đức trên bản đồ</p>
                </div>
                <button
                  onClick={() => setIsMapModalOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="aspect-[16/9] bg-slate-100">
                <iframe
                  title="Bản đồ Thủ Đức"
                  src="https://maps.google.com/maps?q=Thủ+Đức&output=embed"
                  className="h-full w-full border-0"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
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
                  data-listing-id={listing.id}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  className={`group cursor-pointer overflow-hidden rounded-[24px] border bg-white shadow-[0_20px_50px_-35px_rgba(255,136,0,0.3)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-25px_rgba(255,115,0,0.45)] ${highlightListingId === listing.id ? "border-[#ff6a3d] ring-2 ring-orange-300" : "border-orange-100"}`}
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

                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-orange-600 shadow">
                      <BadgeDollarSign className="h-3.5 w-3.5 text-orange-600" />
                      {listing.rentPrice.toLocaleString("vi-VN")} đ/tháng
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-[#ff6a3d] transition">
                      {listing.title}
                    </h3>

                    <div className="mt-2 flex items-center text-xs text-slate-500 gap-3">
                      <MapPin className="h-3.5 w-3.5 text-orange-500" />
                      <span className="line-clamp-1">{location || "Chưa cập nhật địa chỉ"}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700">{listing.preferredGender || "Mọi giới tính"}</span>
                      </div>

                      {softFilterResults[listing.id] ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
                          {Math.round(softFilterResults[listing.id].total_score)}/100
                        </span>
                      ) : null}
                    </div>

                    {softFilterResults[listing.id] && getAllLifestylePrefs(softFilterResults[listing.id]).length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {getAllLifestylePrefs(softFilterResults[listing.id]).map((pref) => (
                          <div key={pref.field} className="flex items-start gap-2">
                            <div className="h-2.5 w-2.5 mt-1 rounded-full bg-orange-200" />
                            <div className="text-[12px] text-slate-700">
                              <div className="font-medium text-slate-800">{FIELD_FULL_LABELS[pref.field] || pref.field}</div>
                              <div className="text-[11px] text-slate-600">{pref.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
