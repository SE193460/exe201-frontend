import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPinned, Heart, Shield, MessageCircle, Lock, ChevronRight, Zap, DollarSign, User, Sparkles, MapPin } from "lucide-react";
import { fetchProfile, resolveAvatarUrl } from "../api/services/user";
import { fetchPublicListings, resolveListingImageUrl, toggleSaveListing } from "../api/services/listings";
import type { Listing } from "../api/services/listings";
import { PRICE_OPTIONS } from "./listingRangeOptions";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const GENDER_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "FEMALE", label: "Nữ" },
  { id: "MALE", label: "Nam" },
  { id: "ANY", label: "Nam/Nữ" },
];

const INTEREST_OPTIONS = [
  { id: "all", label: "Tất cả" },
  { id: "clean", label: "Sạch sẽ" },
  { id: "quiet", label: "Yên tĩnh" },
  { id: "pet", label: "Thú cưng OK" },
  { id: "cooking", label: "Nấu ăn" },
  { id: "social", label: "Thân thiện" },
];

function formatPrice(price: number) {
  if (price >= 1000000) {
    const tr = price / 1000000;
    return `${tr % 1 === 0 ? tr.toFixed(0) : tr.toFixed(1)}Tr`;
  }
  return price.toLocaleString("vi-VN");
}

export default function HomePage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedInterest, setSelectedInterest] = useState("all");
  const [selectedArea, setSelectedArea] = useState("all");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        const filtered = data
          .filter((l) => l.status === "APPROVED" && l.images && l.images.length > 0)
          .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
        setListings(filtered.slice(0, 3));
        const saved = new Set<string>();
        data.forEach((l) => { if (l.isSaved) saved.add(l.id); });
        setSavedIds(saved);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseSearchQuery = (query: string) => {
    const lower = query.toLowerCase();
    let gender = selectedGender;
    let area = selectedArea;
    let price = selectedPrice;
    let interest = selectedInterest;
    let remaining = query.trim();

    // Gender detection
    const genderMap: Record<string, string> = {
      "nữ": "FEMALE", "nu": "FEMALE", "gái": "FEMALE", "con gái": "FEMALE",
      "nam": "MALE", "trai": "MALE", "con trai": "MALE",
      "nam nữ": "ANY", "nữ nam": "ANY", "cả nam cả nữ": "ANY", "tất cả": "ANY",
    };
    for (const [kw, val] of Object.entries(genderMap)) {
      if (lower.includes(kw)) {
        gender = val;
        remaining = remaining.replace(new RegExp(kw, "gi"), "").trim();
        break;
      }
    }

    // Area detection
    const areaMap: Record<string, string> = {
      "quận 1": "quan1", "q1": "quan1", "quận 2": "quan2", "q2": "quan2",
      "quận 3": "quan3", "q3": "quan3", "quận 7": "quan7", "q7": "quan7",
      "thủ đức": "thuduc", "thu duc": "thuduc",
    };
    for (const [kw, val] of Object.entries(areaMap)) {
      if (lower.includes(kw)) {
        area = val;
        remaining = remaining.replace(new RegExp(kw, "gi"), "").trim();
        break;
      }
    }

    // Price detection
    const pricePatterns = [
      { regex: /d[ưới]+ (\d+) tri[ệu]/, handler: (m: RegExpMatchArray) => {
        const n = parseInt(m[1]);
        if (n <= 1) return "under_1m";
        if (n <= 2) return "1m_2m";
        if (n <= 3) return "2m_3m";
        if (n <= 5) return "3m_5m";
        if (n <= 7) return "5m_7m";
        if (n <= 10) return "7m_10m";
        return "10m_15m";
      }},
      { regex: /tr[ê]+n (\d+) tri[ệu]/, handler: (m: RegExpMatchArray) => {
        const n = parseInt(m[1]);
        if (n >= 15) return "over_15m";
        if (n >= 10) return "10m_15m";
        if (n >= 7) return "7m_10m";
        return "5m_7m";
      }},
      { regex: /(\d+)[-_](\d+) tri[ệu]/, handler: (m: RegExpMatchArray) => {
        const min = parseInt(m[1]);
        const max = parseInt(m[2]);
        if (min >= 10 || max >= 15) return "10m_15m";
        if (min >= 7) return "7m_10m";
        if (min >= 5) return "5m_7m";
        if (min >= 3) return "3m_5m";
        if (min >= 2) return "2m_3m";
        return "1m_2m";
      }},
      { regex: /(\d+) tri[ệu]/, handler: (m: RegExpMatchArray) => {
        const n = parseInt(m[1]);
        if (n <= 1) return "under_1m";
        if (n <= 2) return "1m_2m";
        if (n <= 3) return "2m_3m";
        if (n <= 5) return "3m_5m";
        if (n <= 7) return "5m_7m";
        if (n <= 10) return "7m_10m";
        return "10m_15m";
      }},
    ];
    for (const { regex, handler } of pricePatterns) {
      const match = lower.match(regex);
      if (match) {
        price = handler(match);
        remaining = remaining.replace(regex, "").trim();
        break;
      }
    }

    // Interest detection
    const interestMap: Record<string, string> = {
      "sạch": "clean", "sạch sẽ": "clean", "sach": "clean",
      "yên tĩnh": "quiet", "yen tinh": "quiet", "im lặng": "quiet",
      "thú cưng": "pet", "thu cung": "pet", "pet": "pet", "mèo": "pet", "chó": "pet",
      "nấu ăn": "cooking", "nau an": "cooking", "nấu": "cooking",
      "thân thiện": "social", "than thien": "social", "vui vẻ": "social",
    };
    for (const [kw, val] of Object.entries(interestMap)) {
      if (lower.includes(kw)) {
        interest = val;
        remaining = remaining.replace(new RegExp(kw, "gi"), "").trim();
        break;
      }
    }

    return { gender, area, price, interest, remaining: remaining.replace(/\s+/g, " ").trim() };
  };

  const handleSearch = () => {
    const parsed = searchQuery.trim() ? parseSearchQuery(searchQuery) : { gender: selectedGender, area: selectedArea, price: selectedPrice, interest: selectedInterest, remaining: "" };
    const finalGender = parsed.gender !== "all" ? parsed.gender : selectedGender;
    const finalArea = parsed.area !== "all" ? parsed.area : selectedArea;
    const finalPrice = parsed.price !== "all" ? parsed.price : selectedPrice;
    const finalInterest = parsed.interest !== "all" ? parsed.interest : selectedInterest;

    const params = new URLSearchParams();
    if (parsed.remaining) params.set("q", parsed.remaining);
    if (finalPrice !== "all") params.set("price", finalPrice);
    if (finalGender !== "all") params.set("gender", finalGender);
    if (finalInterest !== "all") params.set("interest", finalInterest);
    if (finalArea !== "all") params.set("area", finalArea);

    if (params.toString() === "") {
      setError("Vui lòng chọn bộ lọc hoặc nhập thông tin tìm kiếm.");
      return;
    }

    setError("");
    navigate(`/listings?${params.toString()}`);
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
    } catch { /* ignore */ }
  };

  const getLabel = (options: Array<{ id: string; label: string }>, value: string) => {
    return options.find((o) => o.id === value)?.label || "Tất cả";
  };

  const chips = [
    { key: "price", icon: <DollarSign className="h-3.5 w-3.5" />, label: "Khoảng giá", value: selectedPrice, options: PRICE_OPTIONS, set: setSelectedPrice },
    { key: "gender", icon: <User className="h-3.5 w-3.5" />, label: "Giới tính", value: selectedGender, options: GENDER_OPTIONS, set: setSelectedGender },
    { key: "interest", icon: <Sparkles className="h-3.5 w-3.5" />, label: "Sở thích", value: selectedInterest, options: INTEREST_OPTIONS, set: setSelectedInterest },
    { key: "area", icon: <MapPin className="h-3.5 w-3.5" />, label: "Khu vực", value: selectedArea, options: [
      { id: "all", label: "Tất cả" },
      { id: "quan1", label: "Quận 1" },
      { id: "quan2", label: "Quận 2" },
      { id: "quan3", label: "Quận 3" },
      { id: "quan7", label: "Quận 7" },
      { id: "thuduc", label: "Thủ Đức" },
    ], set: setSelectedArea },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {error && (
          <div className="mx-auto max-w-[1200px] px-6 pt-4">
            <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm">
              <span className="text-red-600">{error}</span>
            </div>
          </div>
        )}

        {/* Hero section */}
        <section className="bg-gradient-to-b from-[#FFF8F0] to-white px-6 pb-10 pt-12 text-center md:pt-16">
          <div className="mx-auto max-w-[720px]">
            <h1 className="text-2xl font-extrabold leading-tight text-[var(--on-surface)] md:text-4xl" style={{ fontFamily: "var(--font-main)" }}>
              Tìm bạn cùng phòng <span className="text-[var(--primary)]">lý tưởng</span><br />
              cho không gian sống của bạn
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-sm text-slate-500 md:text-base">
              Kết nối với những người có cùng phong cách sống, sở thích và ngân sách. An toàn, tin cậy và hoàn toàn miễn phí.
            </p>
          </div>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-[640px]">
            <div className="flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg">
              <div className="flex flex-1 items-center gap-3 px-5">
                <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Bạn muốn sống ở khu vực nào?"
                  className="w-full bg-transparent py-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={handleSearch}
                className="bg-[var(--primary)] px-8 text-sm font-bold text-white transition hover:opacity-90"
              >
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* Filter chips with dropdowns */}
          <div className="mx-auto mt-5 flex max-w-[600px] flex-wrap justify-center gap-3" ref={dropdownRef}>
            {chips.map((chip) => (
              <div key={chip.key} className="relative">
                <button
                  onClick={() => {
                    setOpenDropdown(openDropdown === chip.key ? null : chip.key);
                    setError("");
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    chip.value !== "all"
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
                  }`}
                >
                  {chip.icon}
                  {chip.value !== "all" ? getLabel(chip.options, chip.value) : chip.label}
                </button>

                {openDropdown === chip.key && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-48 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
                    {chip.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          chip.set(opt.id);
                          setOpenDropdown(null);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                          chip.value === opt.id ? "font-semibold text-[var(--primary)] bg-orange-50/50" : "text-slate-600"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Featured listings */}
        <section className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[var(--on-surface)] md:text-2xl" style={{ fontFamily: "var(--font-main)" }}>
                Phòng ở ghép nổi bật
              </h2>
              <p className="mt-1 text-sm text-slate-500">Khám phá những không gian sống tuyệt vời nhất tuần này</p>
            </div>
            <button
              onClick={() => navigate("/listings")}
              className="hidden items-center gap-1 text-sm font-semibold text-[var(--primary)] transition hover:underline sm:flex"
            >
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 3).map((listing) => {
              const thumbnail = resolveListingImageUrl(listing.images?.[0]?.imageUrl || "");
              const location = [listing.ward, listing.district, listing.city].filter(Boolean).join(", ");
              const avatarUrl = resolveAvatarUrl(listing.ownerAvatar || "");
              const isSaved = savedIds.has(listing.id);

              return (
                <div
                  key={listing.id}
                  className="group overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
                  onClick={() => navigate(`/listings/${listing.id}`)}
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img src={thumbnail} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-emerald-600 backdrop-blur-sm">
                      <Shield className="h-3 w-3" /> Đã xác thực
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-bold text-white">
                      {formatPrice(listing.rentPrice)}<span className="text-[10px] font-medium">/tháng</span>
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[var(--on-surface)] line-clamp-1" style={{ fontFamily: "var(--font-main)" }}>
                      {listing.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPinned className="h-3 w-3 flex-shrink-0 text-[var(--primary)]" />
                      {location || "Chưa cập nhật"}
                    </p>

                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {listing.amenities.slice(0, 3).map((a) => (
                          <span key={a.id} className="rounded-full border border-slate-200 bg-[var(--surface)] px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                            {a.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-container)] text-[10px] font-bold text-[var(--primary)]">
                            {(listing.ownerName || "C")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-700">{listing.ownerName || "Chủ phòng"}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleToggleSave(e, listing.id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                          isSaved ? "text-red-500 hover:bg-red-50" : "text-slate-400 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => navigate("/listings")}
            className="mt-6 flex w-full items-center justify-center gap-1 rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 sm:hidden"
          >
            Xem tất cả <ChevronRight className="h-4 w-4" />
          </button>
        </section>

        {/* Why Roomie */}
        <section className="bg-[var(--surface)] px-6 py-12 md:py-16">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-center text-xl font-extrabold text-[var(--on-surface)] md:text-2xl" style={{ fontFamily: "var(--font-main)" }}>
              Tại sao chọn Roomie?
            </h2>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {/* Big orange card */}
              <div className="rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary)] to-[#e67e00] p-8 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold" style={{ fontFamily: "var(--font-main)" }}>Hồ sơ đã xác minh</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Chúng tôi kiểm duyệt mọi người dùng và bài đăng để đảm bảo an toàn tuyệt đối cho cộng đồng.
                </p>
              </div>

              <div className="grid gap-5">
                {/* Ghép đôi thông minh */}
                <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-container)]">
                      <Zap className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Ghép đôi thông minh</h3>
                      <p className="mt-1 text-sm text-slate-500">Thuật toán dựa trên thói quen sinh hoạt và sở thích cá nhân.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {/* Trò chuyện trực tiếp */}
                  <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-container)]">
                      <MessageCircle className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Trò chuyện trực tiếp</h3>
                    <p className="mt-1 text-xs text-slate-500">Kết nối ngay không cần trung gian.</p>
                  </div>

                  {/* Bảo mật dữ liệu */}
                  <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-container)]">
                      <Lock className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>Bảo mật dữ liệu</h3>
                    <p className="mt-1 text-xs text-slate-500">Thông tin của bạn luôn được ẩn cho đến khi bạn đồng ý.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
