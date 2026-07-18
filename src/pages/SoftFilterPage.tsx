import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Filter, Home, Users, Search, Lightbulb, RefreshCw } from "lucide-react";
import UserShell from "../layouts/UserShell";
import { resolveListingImageUrl } from "../api/services/listings";
import {
  fetchRoommatePreferences,
  runSoftFilter,
  updateRoommatePreferences,
} from "../api/services/lifestyle";
import type { RoommatePreferences, SoftFilterResult } from "../api/services/lifestyle";
import {
  AREA_OPTIONS,
  areaRangeToBounds,
  PRICE_OPTIONS,
  priceRangeToBounds,
} from "./listingRangeOptions";
import { DISTRICT_OPTIONS, FILTER_LINEAR_OPTIONS, PREF_OPTIONS } from "./lifestyleOptions";
import { trackEvent } from "../api/services/analytics";

type HardFiltersForm = {
  district: string;
  price_range: string;
  area_range: string;
};

function fieldLabels(t: (key: string) => string): Record<string, string> {
  return {
    smoking: t("Hút thuốc"),
    pet: t("Thú cưng"),
    cleanliness: t("Độ sạch sẽ"),
    noise: t("Mức độ yên tĩnh"),
    ac_usage: t("Tần suất dùng điều hòa"),
    work_schedule: t("Lịch làm việc"),
    guest: t("Bạn bè ghé phòng"),
    sharing: t("Chia sẻ đồ dùng"),
    cooking: t("Nấu ăn"),
    home_frequency: t("Tần suất ở trong phòng"),
    call_frequency: t("Gọi điện/video call"),
    game_mic: t("Tần suất game voice chat"),
  };
}

const ALL_PREF_FIELDS = [
  "pref_cleanliness", "pref_ac_usage", "pref_pet", "pref_smoking",
  "pref_cooking", "pref_guest", "pref_home_frequency", "pref_work_schedule",
  "pref_sharing", "pref_noise", "pref_call_frequency", "pref_game_mic",
];

function selectClassName() {
  return "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]";
}

export default function SoftFilterPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<2 | 3>(2);
  const [prefs, setPrefs] = useState<RoommatePreferences>({});
  const [hardFilters, setHardFilters] = useState<HardFiltersForm>({ district: "", price_range: "all", area_range: "all" });
  const [results, setResults] = useState<SoftFilterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRoommatePreferences()
      .then((data) => setPrefs(data || {}))
      .catch(() => {
        // ignore and let user fill manually
      });
  }, []);

  const labels = fieldLabels(t);

  const linearWithAny = useMemo(() => {
    return {
      cleanliness: [...FILTER_LINEAR_OPTIONS.cleanliness, PREF_OPTIONS.intAny],
      ac_usage: [...FILTER_LINEAR_OPTIONS.ac_usage, PREF_OPTIONS.intAny],
      cooking: [...FILTER_LINEAR_OPTIONS.cooking, PREF_OPTIONS.intAny],
      guest: [...FILTER_LINEAR_OPTIONS.guest, PREF_OPTIONS.intAny],
      home_frequency: [...FILTER_LINEAR_OPTIONS.home_frequency, PREF_OPTIONS.intAny],
      noise: [...FILTER_LINEAR_OPTIONS.noise, PREF_OPTIONS.intAny],
      call_frequency: [...FILTER_LINEAR_OPTIONS.call_frequency, PREF_OPTIONS.intAny],
      game_mic: [...FILTER_LINEAR_OPTIONS.game_mic, PREF_OPTIONS.intAny],
    };
  }, []);

  const setPrefNumber = (field: keyof RoommatePreferences, value: string) => {
    setPrefs((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const setPrefText = (field: keyof RoommatePreferences, value: string) => {
    setPrefs((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const submitSoftFilter = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setResultsLoading(true);
    setError("");
    setStep(3);
    try {
      await updateRoommatePreferences(prefs);

      trackEvent({
        eventName: "listing_filter_applied",
        metadata: {
          district: hardFilters.district || null,
          priceRange: hardFilters.price_range,
          areaRange: hardFilters.area_range,
        },
      });

      const response = await runSoftFilter({
        user_type: "NO_ROOM",
        hard_filters: {
          district: hardFilters.district || null,
          min_price: priceRangeToBounds(hardFilters.price_range).min,
          max_price: priceRangeToBounds(hardFilters.price_range).max,
          min_area: areaRangeToBounds(hardFilters.area_range).min,
          max_area: areaRangeToBounds(hardFilters.area_range).max,
        },
      });

      const resultsData = response.results || [];
      setResults(resultsData);
      // Lưu vào localStorage để hiển thị điểm ở trang chủ
      localStorage.setItem("softFilterResults", JSON.stringify(resultsData));
      localStorage.setItem("softFilterTimestamp", new Date().toISOString());
      // Dispatch custom event để thông báo cho PublicListingsPage cập nhật
      window.dispatchEvent(new CustomEvent("softFilterUpdated", { detail: resultsData }));
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || t("Không thể chạy bộ lọc mềm. Vui lòng thử lại."));
      setResults([]);
    } finally {
      setLoading(false);
      setResultsLoading(false);
    }
  };

  const renderResultSkeleton = (index: number) => (
    <article key={`skeleton-${index}`} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5">
      <div className="h-5 w-2/3 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-slate-50" />
      <div className="mt-4 h-6 w-24 rounded bg-slate-100" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="h-28 rounded-lg bg-emerald-50" />
        <div className="h-28 rounded-lg bg-amber-50" />
      </div>
    </article>
  );

  const renderResultCard = (result: SoftFilterResult) => {
    const entries = Object.entries(result.field_scores || {});
    const good = entries.filter(([, value]) => value.score >= 0.75);
    const warn = entries.filter(([, value]) => value.score < 0.75);

    return (
      <article key={result.id} className="rounded-lg border border-slate-200 bg-white p-5">
        {result.title ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{result.title}</h3>
              <p className="text-sm text-slate-500">{result.district || "-"} {result.address ? `• ${result.address}` : ""}</p>
              <p className="mt-1 text-sm">{t("Giá:")} <span className="font-semibold">{result.rent_price?.toLocaleString("vi-VN") || 0}đ</span></p>
              <p className="text-sm">{t("Chủ phòng:")} {result.owner?.name || "-"}</p>
              <button
                onClick={() => window.open(`${window.location.origin}/listings/${result.id}`, '_blank')}
                className="mt-2 inline-block text-sm font-semibold text-[var(--primary)] hover:underline bg-none border-none cursor-pointer p-0"
              >
                {t("Xem chi tiết listing")}
              </button>
            </div>
            {result.image_url ? (
              <img src={resolveListingImageUrl(result.image_url)} alt={result.title} className="h-24 w-full rounded-lg object-cover md:w-40" />
            ) : null}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{result.full_name || t("Người dùng")}</h3>
            <p className="text-sm text-slate-500">{result.email || ""}</p>
            <p className="text-sm text-slate-500">{t("Số điện thoại:")} {result.phone_number || t("Chưa cập nhật")}</p>
            {result.phone_number ? (
              <a
                href={`https://zalo.me/${result.phone_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition border border-blue-200"
              >
                💬 {t("Nhắn Zalo")}
              </a>
            ) : (
              <p className="text-sm text-slate-500">{t("Zalo: Chưa cập nhật")}</p>
            )}
          </div>
        )}

        <p className="mt-4 text-xl font-bold text-[var(--primary)]">{Math.round(result.total_score)}/100</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {t("Điểm tốt")}</h4>
            <div className="mt-2 space-y-3 text-sm">
              {good.length === 0 ? <p className="text-slate-500">{t("Không có.")}</p> : null}
              {good.map(([field, value]) => (
                <div key={`${result.id}-${field}`} className="rounded-lg bg-white p-2.5 border border-emerald-100">
                  <p className="font-semibold text-slate-800">{labels[field] || field}</p>
                  <div className="mt-1.5 space-y-1 text-xs">
                    <p className="text-slate-600"><span className="font-medium text-slate-700">{t("Lựa chọn của họ:")}</span> {value.profile_value}</p>
                    <p className="text-slate-600"><span className="font-medium text-slate-700">{t("Lựa chọn của bạn:")}</span> {value.pref_value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <h4 className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700"><AlertTriangle className="h-4 w-4" /> {t("Điểm cần lưu ý")}</h4>
            <div className="mt-2 space-y-3 text-sm">
              {warn.length === 0 ? <p className="text-slate-500">{t("Không có.")}</p> : null}
              {warn.map(([field, value]) => (
                <div key={`${result.id}-${field}`} className="rounded-lg bg-white p-2.5 border border-amber-100">
                  <p className="font-semibold text-slate-800">{labels[field] || field}</p>
                  <div className="mt-1.5 space-y-1 text-xs">
                    <p className="text-slate-600"><span className="font-medium text-slate-700">{t("Lựa chọn của họ:")}</span> {value.profile_value}</p>
                    <p className="text-slate-600"><span className="font-medium text-slate-700">{t("Lựa chọn của bạn:")}</span> {value.pref_value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const filledPrefsCount = useMemo(() => {
    return ALL_PREF_FIELDS.filter((f) => prefs[f as keyof RoommatePreferences] != null && prefs[f as keyof RoommatePreferences] !== "").length;
  }, [prefs]);

  const progressPercent = Math.round((filledPrefsCount / ALL_PREF_FIELDS.length) * 100);

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[1100px] space-y-6">
        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>{t("Bộ lọc mềm tìm bạn cùng phòng")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("Lưu tiêu chí mềm, áp dụng bộ lọc cứng, sau đó xem danh sách gợi ý theo điểm tương thích.")}</p>
          {error ? <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">{error}</p> : null}
        </header>

        {step === 2 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Left Column - Filters */}
            <form onSubmit={submitSoftFilter} className="space-y-5">

              {/* Hard Filters */}
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-bold text-slate-900">{t("Bộ lọc cứng")}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Khu vực")}
                    <select className={selectClassName()} value={hardFilters.district} onChange={(e) => setHardFilters((prev) => ({ ...prev, district: e.target.value }))}>
                      <option value="">{t("Tất cả khu vực")}</option>
                      {DISTRICT_OPTIONS.map((district) => <option key={district} value={district}>{t(district)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Giá (triệu VND)")}
                    <select className={selectClassName()} value={hardFilters.price_range} onChange={(e) => setHardFilters((prev) => ({ ...prev, price_range: e.target.value }))}>
                      {PRICE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Diện tích (m²)")}
                    <select className={selectClassName()} value={hardFilters.area_range} onChange={(e) => setHardFilters((prev) => ({ ...prev, area_range: e.target.value }))}>
                      {AREA_OPTIONS.map((option) => <option key={option.id} value={option.id}>{t(option.label)}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              {/* Soft Filter - Sinh hoạt cơ bản */}
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-bold text-slate-900">{t("Bộ lọc mềm - Sinh hoạt cơ bản")}</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">{t("Bạn mong muốn roommate có mức độ sạch sẽ như thế nào?")}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "", label: t("Bỏ trống") },
                        ...FILTER_LINEAR_OPTIONS.cleanliness.map((o) => ({ value: String(o.value), label: t(o.label) })),
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPrefNumber("pref_cleanliness", option.value)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            String(prefs.pref_cleanliness ?? "") === option.value
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="block text-sm font-medium text-slate-700">
                      {t("Sử dụng điều hòa")}
                      <select className={selectClassName()} value={prefs.pref_ac_usage ?? ""} onChange={(e) => setPrefNumber("pref_ac_usage", e.target.value)}>
                        <option value="">{t("Bỏ trống")}</option>
                        {linearWithAny.ac_usage.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      {t("Nuôi thú cưng?")}
                      <select className={selectClassName()} value={prefs.pref_pet ?? ""} onChange={(e) => setPrefText("pref_pet", e.target.value)}>
                        <option value="">{t("Bỏ trống")}</option>
                        {PREF_OPTIONS.pet.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      {t("Hút thuốc?")}
                      <select className={selectClassName()} value={prefs.pref_smoking ?? ""} onChange={(e) => setPrefText("pref_smoking", e.target.value)}>
                        <option value="">{t("Bỏ trống")}</option>
                        {PREF_OPTIONS.smoking.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
              </section>

              {/* Soft Filter - Thói quen ở phòng */}
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-bold text-slate-900">{t("Bộ lọc mềm - Thói quen ở phòng")}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Nấu ăn trong phòng")}
                    <select className={selectClassName()} value={prefs.pref_cooking ?? ""} onChange={(e) => setPrefNumber("pref_cooking", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {linearWithAny.cooking.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Dẫn bạn bè về")}
                    <select className={selectClassName()} value={prefs.pref_guest ?? ""} onChange={(e) => setPrefNumber("pref_guest", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {linearWithAny.guest.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Thời gian ở phòng")}
                    <select className={selectClassName()} value={prefs.pref_home_frequency ?? ""} onChange={(e) => setPrefNumber("pref_home_frequency", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {linearWithAny.home_frequency.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Thời gian làm việc")}
                    <select className={selectClassName()} value={prefs.pref_work_schedule ?? ""} onChange={(e) => setPrefText("pref_work_schedule", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {PREF_OPTIONS.work_schedule.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              {/* Soft Filter - Môi trường sống chung */}
              <section className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="text-lg font-bold text-slate-900">{t("Bộ lọc mềm - Môi trường sống chung")}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Chia sẻ đồ dùng chung")}
                    <select className={selectClassName()} value={prefs.pref_sharing ?? ""} onChange={(e) => setPrefText("pref_sharing", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {PREF_OPTIONS.sharing.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Mức độ yên tĩnh")}
                    <select className={selectClassName()} value={prefs.pref_noise ?? ""} onChange={(e) => setPrefNumber("pref_noise", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {linearWithAny.noise.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Gọi điện / Video Call")}
                    <select className={selectClassName()} value={prefs.pref_call_frequency ?? ""} onChange={(e) => setPrefNumber("pref_call_frequency", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {linearWithAny.call_frequency.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("Chơi game có Mic")}
                    <select className={selectClassName()} value={prefs.pref_game_mic ?? ""} onChange={(e) => setPrefNumber("pref_game_mic", e.target.value)}>
                      <option value="">{t("Bỏ trống")}</option>
                      {linearWithAny.game_mic.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              {/* Mobile submit button */}
              <div className="lg:hidden">
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70 transition">
                  <Search className="mr-2 inline h-4 w-4" />
                  {loading ? t("Đang tìm...") : t("Tìm kết quả")}
                </button>
              </div>
            </form>

            {/* Right Column - Sidebar */}
            <aside className="space-y-5">
              {/* Complete Setup Card */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-bold text-slate-900">{t("Hoàn tất thiết lập")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Hệ thống sẽ dựa trên các tiêu chí bạn chọn để tìm kiếm những người bạn cùng phòng phù hợp nhất.")}</p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{t("Tiêu chí đã chọn:")}</span>
                    <span className="font-bold text-[var(--primary)]">{filledPrefsCount}/{ALL_PREF_FIELDS.length}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  onClick={submitSoftFilter}
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-70 transition">
                  <Search className="h-4 w-4" />
                  {loading ? t("Đang tìm...") : t("Tìm kết quả")}
                </button>
                <button type="button"
                  onClick={() => {
                    setPrefs({});
                    setHardFilters({ district: "", price_range: "all", area_range: "all" });
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                  <RefreshCw className="mr-1.5 inline h-4 w-4" />
                  {t("Làm mới bộ lọc")}
                </button>
              </div>

              {/* Tips Card */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-[var(--primary)]" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--primary)]">{t("Mẹo tìm kiếm")}</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    <span>{t('Chọn "Bỏ trống" nếu tiêu chí đó không quá quan trọng với bạn.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                    <span>{t("Ưu tiên các bộ lọc về lối sống để tìm được roommate bền vững.")}</span>
                  </li>
                </ul>
              </div>

              {/* Promo Card */}
              <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=250&fit=crop"
                  alt={t("Roommate community")}
                  className="h-40 w-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-base font-bold text-white">{t("Tìm roommate ưng ý chỉ trong 24h!")}</p>
                  <p className="mt-1 text-xs text-slate-300">{t("Tham gia cộng đồng Roomie Premium ngay")}</p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("Kết quả")}</h2>
                <p className="text-sm text-slate-500">
                  {resultsLoading ? t("Đang phân tích độ tương thích...") : t("Tìm thấy {{count}} kết quả", { count: results.length })}
                </p>
              </div>
              <button onClick={() => setStep(2)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">{t("Sửa bộ lọc")}</button>
            </div>

            {resultsLoading ? (
              <div className="space-y-4">
                {renderResultSkeleton(1)}
                {renderResultSkeleton(2)}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">{t("Không có kết quả phù hợp với bộ lọc hiện tại.")}</div>
            ) : (
              <div className="space-y-4">{results.map(renderResultCard)}</div>
            )}
          </section>
        )}
      </div>
    </UserShell>
  );
}
