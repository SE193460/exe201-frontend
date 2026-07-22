import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, X, Sparkles, ChevronLeft, ChevronRight, Search, CheckCircle2, AlertCircle, Heart } from "lucide-react";
import { fetchPublicListings, resolveListingImageUrl, toggleSaveListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import type { SoftFilterResult, RoommatePreferences } from "../api/services/lifestyle";
import { fetchProfile } from "../api/services/user";
import { fetchRoommatePreferences, updateRoommatePreferences, runSoftFilter, deleteRoommatePreferences } from "../api/services/lifestyle";
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
  
  const [recommendedPage, setRecommendedPage] = useState(1);
  const [unscoredPage, setUnscoredPage] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [softFilterResults, setSoftFilterResults] = useState<Record<string, SoftFilterResult>>({});
  const [softFilterSource, setSoftFilterSource] = useState<'roommate_preferences' | 'lifestyle_profile' | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [softFilterPrefs, setSoftFilterPrefs] = useState<RoommatePreferences>({});
  const [softFilterLoading, setSoftFilterLoading] = useState(false);
  const [softFilterSection, setSoftFilterSection] = useState(1);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const RECOMMENDED_PAGE_SIZE = 6;
  const UNSCORED_PAGE_SIZE = 6;

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

  const getMatchingSummary = (result: SoftFilterResult | undefined) => {
    if (!result?.field_scores) return { good: [], caution: [] };
    const order = ["ac_usage", "cooking", "home_frequency", "call_frequency", "smoking", "pet", "cleanliness", "guest", "noise", "game_mic", "work_schedule", "sharing"];
    const good: Array<{ field: string; prefLabel: string; score: number }> = [];
    const caution: Array<{ field: string; prefLabel: string; score: number }> = [];

    for (const field of order) {
      const data = result.field_scores[field];
      if (!data) continue;
      const prefLabel = getFieldValueLabel(field, data.pref_value) || getFieldValueLabel(field, data.profile_value) || t("Đã chọn");
      const score = typeof data.score === "number" ? data.score : 0;
      const entry = { field, prefLabel, score };
      if (score >= 0.75) good.push(entry);
      else caution.push(entry);
    }

    return { good, caution };
  };

  const setPrefNumber = (field: keyof RoommatePreferences, value: string) => {
    setSoftFilterPrefs((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const setPrefText = (field: keyof RoommatePreferences, value: string) => {
    setSoftFilterPrefs((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleToggleSave = async (e: React.MouseEvent, listingId: string) => {
    e.stopPropagation();
    try {
      const { isSaved } = await toggleSaveListing(listingId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(listingId);
        else next.delete(listingId);
        return next;
      });
    } catch {
      // ignore
    }
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
      setSoftFilterSource(response.source ?? null);
      localStorage.setItem("softFilterResults", JSON.stringify(resultsData));
      if (response.source) localStorage.setItem("softFilterSource", response.source);
      window.dispatchEvent(new CustomEvent("softFilterUpdated", { detail: resultsData }));
      setIsDropdownOpen(false);
    } catch (e) {
      console.error("Lỗi khi áp dụng bộ lọc mềm:", e);
    } finally {
      setSoftFilterLoading(false);
    }
  };

  const handleClearSoftFilter = async () => {
    // Delete roommate preferences from DB (best-effort)
    try {
      await deleteRoommatePreferences();
    } catch (e) {
      console.error("Xóa bộ lọc thất bại:", e);
    }

    // Force re-score using lifestyle profile (regardless of delete success)
    try {
      const response = await runSoftFilter({
        user_type: "NO_ROOM",
        use_lifestyle_profile: true,
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
      setSoftFilterSource(response.source ?? 'lifestyle_profile');
      localStorage.setItem("softFilterResults", JSON.stringify(resultsData));
      if (response.source) localStorage.setItem("softFilterSource", response.source);
      window.dispatchEvent(new CustomEvent("softFilterUpdated", { detail: resultsData }));
    } catch (e) {
      console.error("Lỗi khi chạy lại soft filter:", e);
      // Fallback: clear everything
      setSoftFilterResults({});
      setSoftFilterSource(null);
      localStorage.removeItem("softFilterResults");
      localStorage.removeItem("softFilterSource");
      window.dispatchEvent(new CustomEvent("softFilterUpdated", { detail: [] }));
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
        const saved = new Set<string>();
        data.forEach((listing) => {
          if (listing.isSaved) saved.add(listing.id);
        });
        setSavedIds(saved);
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
      const savedSource = localStorage.getItem("softFilterSource") as 'roommate_preferences' | 'lifestyle_profile' | null;
      if (savedSource) setSoftFilterSource(savedSource);
    } catch (e) {
      console.error("Lỗi khi tải soft filter results:", e);
    }

    // Auto-run soft filter on mount to show scores for all listings
    autoRunSoftFilter();
  }, []);

  const autoRunSoftFilter = async () => {
    try {
      const profile = await fetchProfile();
      if (!profile?.id) return;
      // Check if user has a lifestyle profile (has at least some fields filled)
      const { fetchLifestyleProfile } = await import("../api/services/lifestyle");
      const lifestyle = await fetchLifestyleProfile();
      if (!lifestyle) return;
      const filledFields = Object.entries(lifestyle).filter(([k, v]) => k !== "user_id" && k !== "preferred_district" && v !== null && v !== undefined);
      if (filledFields.length < 3) return; // Not enough profile data

      const { runSoftFilter } = await import("../api/services/lifestyle");
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
      setSoftFilterSource(response.source ?? null);
      localStorage.setItem("softFilterResults", JSON.stringify(resultsData));
      if (response.source) localStorage.setItem("softFilterSource", response.source);
      window.dispatchEvent(new CustomEvent("softFilterUpdated", { detail: resultsData }));
    } catch (e) {
      // Silent fail — user may not be logged in or have no profile
    }
  };

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

  const allScoredListings = [...filteredListings.filter((listing) => Boolean(softFilterResults[listing.id]))].sort((a, b) => {
    const scoreA = softFilterResults[a.id]?.total_score || 0;
    const scoreB = softFilterResults[b.id]?.total_score || 0;
    return scoreB - scoreA;
  });
  const allUnscoredListings = filteredListings.filter((listing) => !softFilterResults[listing.id]);
  const recommendedTotalPages = Math.ceil(allScoredListings.length / RECOMMENDED_PAGE_SIZE);
  const unscoredTotalPages = Math.ceil(allUnscoredListings.length / UNSCORED_PAGE_SIZE);
  const scoredListings = allScoredListings.slice((recommendedPage - 1) * RECOMMENDED_PAGE_SIZE, recommendedPage * RECOMMENDED_PAGE_SIZE);
  const unscoredListings = allUnscoredListings.slice((unscoredPage - 1) * UNSCORED_PAGE_SIZE, unscoredPage * UNSCORED_PAGE_SIZE);

  useEffect(() => {
    if (!highlightListingId || filteredListings.length === 0) return;
    const recommendedIndex = allScoredListings.findIndex((item) => item.id === highlightListingId);
    if (recommendedIndex >= 0) {
      setRecommendedPage(Math.floor(recommendedIndex / RECOMMENDED_PAGE_SIZE) + 1);
      return;
    }
    const unscoredIndex = allUnscoredListings.findIndex((item) => item.id === highlightListingId);
    if (unscoredIndex >= 0) {
      setUnscoredPage(Math.floor(unscoredIndex / UNSCORED_PAGE_SIZE) + 1);
    }
  }, [highlightListingId, filteredListings, allScoredListings, allUnscoredListings]);

  useEffect(() => {
    if (!highlightListingId) return;
    const timer = window.setTimeout(() => {
      const element = document.querySelector(`[data-listing-id="${highlightListingId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [highlightListingId, scoredListings, unscoredListings]);

  useEffect(() => {
    setRecommendedPage(1);
    setUnscoredPage(1);
  }, [district, price, area, genderFilter, interestFilter, searchLocation]);

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
          {Object.keys(softFilterResults).length > 0 && (
            <button
              onClick={handleClearSoftFilter}
              className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              {t("Xóa bộ lọc")}
            </button>
          )}
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
                  onChange={(e) => { setPrice(e.target.value); }}
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
                  onChange={(e) => { setArea(e.target.value); }}
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
                  onChange={(e) => { setGenderFilter(e.target.value); }}
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
            <div className="space-y-6">
              {scoredListings.length > 0 && (
                <section className="rounded-[36px] border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/[0.06] via-white to-amber-50/70 p-4 shadow-[0_18px_45px_-24px_rgba(255,135,78,0.35)] sm:p-5">
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h3 className="text-[1rem] font-extrabold tracking-[0.12em] text-slate-800 leading-6">{t("Bài đăng được đề xuất")}</h3>
                    </div>
                  </div>
                  <div className="grid gap-5">
                    {scoredListings.map((listing) => {
                      const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
                      const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
                      const badge = listing.preferredGender === "FEMALE" ? { text: t("Nữ ở ghép"), color: "bg-amber-600" }
                        : listing.preferredGender === "MALE" ? { text: t("Nam ở ghép"), color: "bg-amber-600" }
                        : listing.preferredGender === "ANY" ? { text: t("Nam/Nữ"), color: "bg-amber-600" }
                        : { text: t("Tìm người ở ghép"), color: "bg-amber-600" };
                      const matchResult = softFilterResults[listing.id];
                      const matchSummary = getMatchingSummary(matchResult);
                      const matchScore = matchResult ? Math.round(matchResult.total_score) : 0;
                      const isSaved = savedIds.has(listing.id);
                      const goodRows = Array.from({ length: Math.ceil(matchSummary.good.length / 2) }, (_, index) => matchSummary.good.slice(index * 2, index * 2 + 2));
                      const cautionRows = Array.from({ length: Math.ceil(matchSummary.caution.length / 2) }, (_, index) => matchSummary.caution.slice(index * 2, index * 2 + 2));

                      return (
                        <article
                          key={listing.id}
                          data-listing-id={listing.id}
                          onClick={() => {
                            trackEvent({ eventName: "listing_card_click", listingId: listing.id, district: listing.district || null, source: "recommended" });
                            navigate(`/listings/${listing.id}`);
                          }}
                          className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-[32px] border bg-white/85 shadow-[0_22px_55px_-24px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_38px_90px_-28px_rgba(0,0,0,0.35)] sm:flex-row ${highlightListingId === listing.id ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "border-[var(--primary)]/20"}`}
                        >
                          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white shadow-lg">
                            <Sparkles className="h-3 w-3" /> Recommended
                          </span>
                          <div className="relative h-56 w-full shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-[260px]">
                            {thumbnail ? (
                              <img src={thumbnail} alt={listing.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-1" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">{t("Chưa có ảnh")}</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 transition duration-500 group-hover:opacity-100" />
                            <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold text-white ${badge.color}`}>
                              {badge.text}
                            </span>
                            {listing.promoExpiresAt && new Date(listing.promoExpiresAt) > new Date() && (
                              <span className="absolute top-3 right-3 rounded-full bg-red-500/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
                                <Sparkles className="h-3 w-3" /> VIP
                              </span>
                            )}
                            <div className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                              {t("Tin mới")}
                            </div>
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-base font-bold text-[var(--on-surface)] line-clamp-1" style={{ fontFamily: "var(--font-main)" }}>
                                {listing.title}
                              </h3>
                              <button
                                onClick={(e) => handleToggleSave(e, listing.id)}
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isSaved ? "text-red-500 hover:bg-red-50" : "text-slate-400 hover:bg-red-50 hover:text-red-500"}`}
                              >
                                <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500" : ""}`} />
                              </button>
                            </div>
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 flex-shrink-0 text-[var(--primary)]" />
                              {location || t("Chưa cập nhật")}
                            </p>

                            <div className="mt-3 rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition duration-500 group-hover:translate-y-[-2px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{t("Phù hợp")}</span>
                                <span className={`text-sm font-black ${matchScore >= 75 ? "text-emerald-600" : matchScore >= 60 ? "text-amber-600" : "text-slate-700"}`}>{matchScore}%</span>
                              </div>
                              <div className="mt-3 h-1.5 rounded-full bg-white/70">
                                <div className="h-1.5 rounded-full bg-gradient-to-r from-[var(--primary)] via-[#ffb04d] to-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, matchScore))}%` }} />
                              </div>
                              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-2">
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">{t("Điểm mạnh")}</div>
                                  <div className="mt-2 flex flex-col gap-2">
                                    {goodRows.map((rowItems, rowIndex) => (
                                      <div key={`good-${rowIndex}`} className="flex flex-wrap gap-2">
                                        {rowItems.map((item) => (
                                          <div key={item.field} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-200 bg-white/90 px-2.5 py-1 text-[11px] text-slate-700 shadow-sm">
                                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                            <span className="whitespace-nowrap">{FIELD_FULL_LABELS[item.field] || item.field}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {matchSummary.caution.length > 0 && (
                                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">{t("Điểm cần lưu ý")}</div>
                                    <div className="mt-2 flex flex-col gap-2">
                                      {cautionRows.map((rowItems, rowIndex) => (
                                        <div key={`caution-${rowIndex}`} className="flex flex-wrap gap-2">
                                          {rowItems.map((item) => (
                                            <div key={item.field} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-2.5 py-1 text-[11px] text-slate-700 shadow-sm">
                                              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                                              <span className="whitespace-nowrap">{FIELD_FULL_LABELS[item.field] || item.field}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
                              <p className="text-base font-extrabold text-[var(--primary)]">
                                {listing.rentPrice >= 1000000
                                  ? `${(listing.rentPrice / 1000000).toFixed(listing.rentPrice % 1000000 === 0 ? 0 : 1)}Tr`
                                  : listing.rentPrice.toLocaleString("vi-VN")}
                                <span className="text-xs font-medium text-slate-400">{t("đ/tháng")}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                                  <Sparkles className="h-3 w-3" />
                                  {matchResult ? `${matchScore}% ${t("Phù hợp")}` : t("Độ phù hợp")}
                                </span>
                                {softFilterSource === "lifestyle_profile" && matchResult && (
                                  <span className="text-[10px] text-slate-400 italic">{t("Theo hồ sơ")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {recommendedTotalPages > 1 && (
                    <div className="mt-5">
                      <Pagination currentPage={recommendedPage} totalPages={recommendedTotalPages} onPageChange={setRecommendedPage} />
                    </div>
                  )}
                </section>
              )}

              {unscoredListings.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">{t("Danh sách các bài đăng")}</h3>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {unscoredListings.map((listing) => {
                      const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
                      const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
                      const isSaved = savedIds.has(listing.id);
                      const badge = listing.preferredGender === "FEMALE" ? { text: t("Nữ ở ghép"), color: "bg-amber-600" }
                        : listing.preferredGender === "MALE" ? { text: t("Nam ở ghép"), color: "bg-amber-600" }
                        : listing.preferredGender === "ANY" ? { text: t("Nam/Nữ"), color: "bg-amber-600" }
                        : { text: t("Tìm người ở ghép"), color: "bg-amber-600" };

                      return (
                        <article
                          key={listing.id}
                          data-listing-id={listing.id}
                          onClick={() => {
                            trackEvent({ eventName: "listing_card_click", listingId: listing.id, district: listing.district || null, source: "normal" });
                            navigate(`/listings/${listing.id}`);
                          }}
                          className={`group relative flex min-h-[320px] cursor-pointer flex-col overflow-hidden rounded-[32px] border bg-white/70 shadow-[0_16px_35px_-24px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_65px_-28px_rgba(0,0,0,0.24)] ${highlightListingId === listing.id ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "border-white/60"}`}
                        >
                          <div className="relative h-48 overflow-hidden bg-slate-100">
                            {thumbnail ? (
                              <img src={thumbnail} alt={listing.title} referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm text-slate-300">{t("Chưa có ảnh")}</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <span className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold text-white ${badge.color}`}>
                              {badge.text}
                            </span>
                          </div>

                          <div className="flex flex-1 flex-col p-4">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-base font-bold text-[var(--on-surface)] line-clamp-1" style={{ fontFamily: "var(--font-main)" }}>
                                {listing.title}
                              </h3>
                              <button
                                onClick={(e) => handleToggleSave(e, listing.id)}
                                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${isSaved ? "text-red-500 hover:bg-red-50" : "text-slate-400 hover:bg-red-50 hover:text-red-500"}`}
                              >
                                <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500" : ""}`} />
                              </button>
                            </div>
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 flex-shrink-0 text-[var(--primary)]" />
                              {location || t("Chưa cập nhật")}
                            </p>
                            <div className="mt-4 border-t border-slate-100 pt-3">
                              <p className="text-base font-extrabold text-[var(--primary)]">
                                {listing.rentPrice >= 1000000
                                  ? `${(listing.rentPrice / 1000000).toFixed(listing.rentPrice % 1000000 === 0 ? 0 : 1)}Tr`
                                  : listing.rentPrice.toLocaleString("vi-VN")}
                                <span className="text-xs font-medium text-slate-400">{t("đ/tháng")}</span>
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {unscoredTotalPages > 1 && (
                    <div className="mt-5">
                      <Pagination currentPage={unscoredPage} totalPages={unscoredTotalPages} onPageChange={setUnscoredPage} />
                    </div>
                  )}
                </section>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
