import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import UserShell from "../layouts/UserShell";
import { listMyListings, resolveListingImageUrl } from "../api/services/listings";
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
import { DISTRICT_OPTIONS, PREF_OPTIONS, PROFILE_OPTIONS } from "./lifestyleOptions";

type UserType = "HAS_ROOM" | "NO_ROOM";

type HardFiltersForm = {
  district: string;
  price_range: string;
  area_range: string;
};

const FIELD_LABELS: Record<string, string> = {
  smoking: "Hút thuốc",
  pet: "Thú cưng",
  cleanliness: "Độ sạch sẽ",
  noise: "Mức độ yên tĩnh",
  ac_usage: "Tần suất dùng điều hòa",
  work_schedule: "Lịch làm việc",
  guest: "Bạn bè ghé phòng",
  sharing: "Chia sẻ đồ dùng",
  cooking: "Nấu ăn",
  home_frequency: "Tần suất ở trong phòng",
  call_frequency: "Gọi điện/video call",
  game_mic: "Tần suất game voice chat",
};

function selectClassName() {
  return "mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300";
}

export default function SoftFilterPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [userType, setUserType] = useState<UserType | "">("");
  const [prefs, setPrefs] = useState<RoommatePreferences>({});
  const [hardFilters, setHardFilters] = useState<HardFiltersForm>({ district: "", price_range: "all", area_range: "all" });
  const [results, setResults] = useState<SoftFilterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");

  useEffect(() => {
    fetchRoommatePreferences()
      .then((data) => setPrefs(data || {}))
      .catch(() => {
        // ignore and let user fill manually
      });

    listMyListings()
      .then((myListings) => {
        const hasApproved = myListings.some((listing) => listing.status === "APPROVED");
        if (hasApproved) {
          setUserType("HAS_ROOM");
        } else {
          setUserType("NO_ROOM");
        }
      })
      .catch(() => {
        setHint("Không xác định được trạng thái bài đăng, vui lòng tự chọn ở bước 1.");
      });
  }, []);

  const linearWithAny = useMemo(() => {
    return {
      cleanliness: [...PROFILE_OPTIONS.cleanliness, PREF_OPTIONS.intAny],
      ac_usage: [...PROFILE_OPTIONS.ac_usage, PREF_OPTIONS.intAny],
      cooking: [...PROFILE_OPTIONS.cooking, PREF_OPTIONS.intAny],
      guest: [...PROFILE_OPTIONS.guest, PREF_OPTIONS.intAny],
      home_frequency: [...PROFILE_OPTIONS.home_frequency, PREF_OPTIONS.intAny],
      noise: [...PROFILE_OPTIONS.noise, PREF_OPTIONS.intAny],
      call_frequency: [...PROFILE_OPTIONS.call_frequency, PREF_OPTIONS.intAny],
      game_mic: [...PROFILE_OPTIONS.game_mic, PREF_OPTIONS.intAny],
    };
  }, []);

  const setPrefNumber = (field: keyof RoommatePreferences, value: string) => {
    setPrefs((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const setPrefText = (field: keyof RoommatePreferences, value: string) => {
    setPrefs((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const goStep2 = () => {
    if (!userType) {
      setError("Vui lòng chọn trạng thái hiện tại.");
      return;
    }
    setError("");
    setStep(2);
  };

  const submitSoftFilter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userType) {
      setError("Vui lòng chọn trạng thái hiện tại.");
      setStep(1);
      return;
    }

    setLoading(true);
    setResultsLoading(true);
    setError("");
    setStep(3);
    try {
      await updateRoommatePreferences(prefs);

      const response = await runSoftFilter({
        user_type: userType,
        hard_filters: {
          district: hardFilters.district || null,
          min_price: priceRangeToBounds(hardFilters.price_range).min,
          max_price: priceRangeToBounds(hardFilters.price_range).max,
          min_area: areaRangeToBounds(hardFilters.area_range).min,
          max_area: areaRangeToBounds(hardFilters.area_range).max,
        },
      });

      setResults(response.results || []);
    } catch (e) {
      const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || "Không thể chạy bộ lọc mềm. Vui lòng thử lại.");
      setResults([]);
    } finally {
      setLoading(false);
      setResultsLoading(false);
    }
  };

  const renderResultSkeleton = (index: number) => (
    <article key={`skeleton-${index}`} className="animate-pulse rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="h-5 w-2/3 rounded bg-orange-100" />
      <div className="mt-2 h-4 w-1/2 rounded bg-orange-50" />
      <div className="mt-4 h-6 w-24 rounded bg-orange-100" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="h-28 rounded-xl bg-emerald-50" />
        <div className="h-28 rounded-xl bg-amber-50" />
      </div>
    </article>
  );

  const renderResultCard = (result: SoftFilterResult) => {
    const entries = Object.entries(result.field_scores || {});
    const good = entries.filter(([, value]) => value.score >= 0.75);
    const warn = entries.filter(([, value]) => value.score < 0.75);

    return (
      <article key={result.id} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
        {result.title ? (
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">{result.title}</h3>
              <p className="text-sm text-slate-500">{result.district || "-"} {result.address ? `• ${result.address}` : ""}</p>
              <p className="mt-1 text-sm">Giá: <span className="font-semibold">{result.rent_price?.toLocaleString("vi-VN") || 0}đ</span></p>
              <p className="text-sm">Chủ phòng: {result.owner?.name || "-"}</p>
              <Link to={`/listings/${result.id}`} className="mt-2 inline-block text-sm font-semibold text-orange-600 hover:text-orange-700">
                Xem chi tiết listing
              </Link>
            </div>
            {result.image_url ? (
              <img src={resolveListingImageUrl(result.image_url)} alt={result.title} className="h-24 w-full rounded-xl object-cover md:w-40" />
            ) : null}
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold">{result.full_name || "Người dùng"}</h3>
            <p className="text-sm text-slate-500">{result.email || ""}</p>
            <p className="text-sm text-slate-500">Số điện thoại: {result.phone_number || "Chưa cập nhật"}</p>
            {result.phone_number ? (
              <a
                href={`https://zalo.me/${result.phone_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition border border-blue-200"
              >
                💬 Nhắn Zalo
              </a>
            ) : (
              <p className="text-sm text-slate-500">Zalo: Chưa cập nhật</p>
            )}
          </div>
        )}

        <p className="mt-4 text-xl font-bold text-orange-600">{Math.round(result.total_score)}/100</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <h4 className="text-sm font-semibold text-emerald-700">✅ Điểm tốt</h4>
            <div className="mt-2 space-y-3 text-sm">
              {good.length === 0 ? <p className="text-slate-500">Không có.</p> : null}
              {good.map(([field, value]) => (
                <div key={`${result.id}-${field}`} className="rounded-lg bg-white/60 p-2.5 border border-emerald-100">
                  <p className="font-semibold text-slate-800">{FIELD_LABELS[field] || field}</p>
                  <div className="mt-1.5 space-y-1 text-xs">
                    <p className="text-slate-600"><span className="font-medium text-slate-700">Lựa chọn của họ:</span> {value.profile_value}</p>
                    <p className="text-slate-600"><span className="font-medium text-slate-700">Lựa chọn của bạn:</span> {value.pref_value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <h4 className="text-sm font-semibold text-amber-700">⚠️ Điểm cần lưu ý</h4>
            <div className="mt-2 space-y-3 text-sm">
              {warn.length === 0 ? <p className="text-slate-500">Không có.</p> : null}
              {warn.map(([field, value]) => (
                <div key={`${result.id}-${field}`} className="rounded-lg bg-white/60 p-2.5 border border-amber-100">
                  <p className="font-semibold text-slate-800">{FIELD_LABELS[field] || field}</p>
                  <div className="mt-1.5 space-y-1 text-xs">
                    <p className="text-slate-600"><span className="font-medium text-slate-700">Lựa chọn của họ:</span> {value.profile_value}</p>
                    <p className="text-slate-600"><span className="font-medium text-slate-700">Lựa chọn của bạn:</span> {value.pref_value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[1000px] space-y-5">
        <header className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-[0_25px_80px_-40px_rgba(255,115,0,0.6)]">
          <h1 className="text-2xl font-bold">Bộ lọc mềm tìm bạn cùng phòng</h1>
          <p className="mt-2 text-sm text-slate-500">Lưu tiêu chí mềm, áp dụng bộ lọc cứng, sau đó xem danh sách gợi ý theo điểm tương thích.</p>
          {hint ? <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">{hint}</p> : null}
          {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        </header>

        {step === 1 && (
          <section className="rounded-3xl border border-orange-100 bg-white p-6">
            <h2 className="text-lg font-semibold">Bước 1: Bạn hiện tại đang ở trạng thái nào?</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="userType" checked={userType === "HAS_ROOM"} onChange={() => setUserType("HAS_ROOM")} />
                Tôi đã có phòng và đã đăng bài
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="userType" checked={userType === "NO_ROOM"} onChange={() => setUserType("NO_ROOM")} />
                Tôi chưa có phòng
              </label>
            </div>
            <button onClick={goStep2} className="mt-5 rounded-full bg-[#ff6a3d] px-5 py-2.5 text-sm font-semibold text-white">Tiếp tục</button>
          </section>
        )}

        {step === 2 && (
          <form onSubmit={submitSoftFilter} className="space-y-5">
            <section className="rounded-3xl border border-orange-100 bg-white p-6">
              <h2 className="text-lg font-semibold">Bước 2: Bộ lọc cứng</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Khu vực
                  <select className={selectClassName()} value={hardFilters.district} onChange={(e) => setHardFilters((prev) => ({ ...prev, district: e.target.value }))}>
                    <option value="">Tất cả</option>
                    {DISTRICT_OPTIONS.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Giá
                  <select className={selectClassName()} value={hardFilters.price_range} onChange={(e) => setHardFilters((prev) => ({ ...prev, price_range: e.target.value }))}>
                    {PRICE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Diện tích
                  <select className={selectClassName()} value={hardFilters.area_range} onChange={(e) => setHardFilters((prev) => ({ ...prev, area_range: e.target.value }))}>
                    {AREA_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-orange-100 bg-white p-6">
              <h2 className="text-lg font-semibold">Bộ lọc mềm - Sinh hoạt cơ bản</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">Độ sạch sẽ
                  <select className={selectClassName()} value={prefs.pref_cleanliness ?? ""} onChange={(e) => setPrefNumber("pref_cleanliness", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.cleanliness.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Tần suất dùng điều hòa
                  <select className={selectClassName()} value={prefs.pref_ac_usage ?? ""} onChange={(e) => setPrefNumber("pref_ac_usage", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.ac_usage.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Thú cưng
                  <select className={selectClassName()} value={prefs.pref_pet ?? ""} onChange={(e) => setPrefText("pref_pet", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {PREF_OPTIONS.pet.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Hút thuốc
                  <select className={selectClassName()} value={prefs.pref_smoking ?? ""} onChange={(e) => setPrefText("pref_smoking", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {PREF_OPTIONS.smoking.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-orange-100 bg-white p-6">
              <h2 className="text-lg font-semibold">Bộ lọc mềm - Thói quen ở phòng</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">Nấu ăn
                  <select className={selectClassName()} value={prefs.pref_cooking ?? ""} onChange={(e) => setPrefNumber("pref_cooking", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.cooking.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Bạn bè về phòng
                  <select className={selectClassName()} value={prefs.pref_guest ?? ""} onChange={(e) => setPrefNumber("pref_guest", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.guest.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Tần suất ở phòng
                  <select className={selectClassName()} value={prefs.pref_home_frequency ?? ""} onChange={(e) => setPrefNumber("pref_home_frequency", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.home_frequency.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Thời gian làm việc
                  <select className={selectClassName()} value={prefs.pref_work_schedule ?? ""} onChange={(e) => setPrefText("pref_work_schedule", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {PREF_OPTIONS.work_schedule.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-orange-100 bg-white p-6">
              <h2 className="text-lg font-semibold">Bộ lọc mềm - Môi trường sống chung</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">Chia sẻ đồ dùng
                  <select className={selectClassName()} value={prefs.pref_sharing ?? ""} onChange={(e) => setPrefText("pref_sharing", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {PREF_OPTIONS.sharing.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Mức độ yên tĩnh
                  <select className={selectClassName()} value={prefs.pref_noise ?? ""} onChange={(e) => setPrefNumber("pref_noise", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.noise.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Gọi điện/video call
                  <select className={selectClassName()} value={prefs.pref_call_frequency ?? ""} onChange={(e) => setPrefNumber("pref_call_frequency", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.call_frequency.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">Game voice chat
                  <select className={selectClassName()} value={prefs.pref_game_mic ?? ""} onChange={(e) => setPrefNumber("pref_game_mic", e.target.value)}>
                    <option value="">Bỏ trống</option>
                    {linearWithAny.game_mic.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setStep(1)} className="rounded-full border border-orange-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Quay lại</button>
              <button type="submit" disabled={loading} className="rounded-full bg-[#ff6a3d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70">{loading ? "Đang tìm..." : "Tìm kết quả"}</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between rounded-3xl border border-orange-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold">Bước 3: Kết quả</h2>
                <p className="text-sm text-slate-500">
                  {resultsLoading ? "Đang phân tích độ tương thích..." : `Tìm thấy ${results.length} kết quả`}
                </p>
              </div>
              <button onClick={() => setStep(2)} className="rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-slate-700">Sửa bộ lọc</button>
            </div>

            {resultsLoading ? (
              <div className="space-y-4">
                {renderResultSkeleton(1)}
                {renderResultSkeleton(2)}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl border border-orange-100 bg-white p-6 text-sm text-slate-500">Không có kết quả phù hợp với bộ lọc hiện tại.</div>
            ) : (
              <div className="space-y-4">{results.map(renderResultCard)}</div>
            )}
          </section>
        )}
      </div>
    </UserShell>
  );
}
