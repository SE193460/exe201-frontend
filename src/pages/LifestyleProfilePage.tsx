import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Sparkles, Lightbulb, Home, Users } from "lucide-react";
import UserShell from "../layouts/UserShell";
import { fetchLifestyleProfile, updateLifestyleProfile } from "../api/services/lifestyle";
import type { LifestyleProfile } from "../api/services/lifestyle";
import { PROFILE_OPTIONS } from "./lifestyleOptions";
import { trackEvent } from "../api/services/analytics";

export default function LifestyleProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<LifestyleProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLifestyleProfile()
      .then((profile) => setForm(profile || {}))
      .catch(() => setError(t("Không thể tải hồ sơ lối sống.")))
      .finally(() => setLoading(false));
  }, []);

  const allFields = [
    form.cleanliness,
    form.ac_usage,
    form.pet_status,
    form.smoking_status,
    form.cooking,
    form.guest,
    form.home_frequency,
    form.work_schedule,
    form.sharing,
    form.noise,
    form.call_frequency,
    form.game_mic,
  ];
  const filled = allFields.filter((v) => v !== null && v !== undefined).length;
  const progress = Math.round((filled / 12) * 100);

  const setNumberField = (field: keyof LifestyleProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const setTextField = (field: keyof LifestyleProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const hasValue = (value: number | string | null | undefined) => value !== null && value !== undefined && value !== "";
  const canShowBlankOption = (field: keyof LifestyleProfile) => !hasValue(form[field]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("");
    setError("");
    setSaving(true);
    try {
      const saved = await updateLifestyleProfile(form);
      setForm(saved);
      trackEvent({ eventName: "lifestyle_profile_updated" });
      setStatus(t("Đã lưu hồ sơ lối sống."));
      navigate("/soft-filter");
    } catch {
      setError(t("Lưu hồ sơ thất bại. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UserShell>
        <div className="mx-auto flex h-60 max-w-[1100px] items-center justify-center">
          <span className="inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)] border-t-transparent" />
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell>
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6 px-4 md:px-6">
        {/* Header + progress */}
        <header>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--on-surface)] md:text-3xl" style={{ fontFamily: "var(--font-main)" }}>
                {t("Hồ sơ lối sống")}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {t("Điền thông tin để hệ thống đề xuất bạn cùng phòng phù hợp hơn.")}
              </p>
            </div>
            <span className="text-sm font-bold text-[var(--primary)]">{progress}% {t("Hoàn tất")}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>

        {status && <p className="rounded-[var(--radius-md)] bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{status}</p>}
        {error && <p className="rounded-[var(--radius-md)] bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: form sections */}
          <div className="space-y-5">
            {/* Section 1: Sinh hoạt cơ bản */}
            <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                  <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
                  {t("Sinh hoạt cơ bản")}
                </h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  {t("1. Mức độ sạch sẽ của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.cleanliness ?? ""}
                    onChange={(e) => setNumberField("cleanliness", e.target.value)}
                  >
                    {canShowBlankOption("cleanliness") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.cleanliness.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("2. Tần suất dùng điều hòa của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.ac_usage ?? ""}
                    onChange={(e) => setNumberField("ac_usage", e.target.value)}
                  >
                    {canShowBlankOption("ac_usage") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.ac_usage.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {t("3. Bạn có nuôi thú cưng không?")}
                    <select
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      value={form.pet_status ?? ""}
                      onChange={(e) => setNumberField("pet_status", e.target.value)}
                    >
                      {canShowBlankOption("pet_status") && <option value="">{t("Bỏ trống")}</option>}
                      {PROFILE_OPTIONS.binary.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t("4. Bạn có hút thuốc không?")}
                    <select
                      className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                      value={form.smoking_status ?? ""}
                      onChange={(e) => setNumberField("smoking_status", e.target.value)}
                    >
                      {canShowBlankOption("smoking_status") && <option value="">{t("Bỏ trống")}</option>}
                      {PROFILE_OPTIONS.binary.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {/* Section 2: Thói quen ở phòng */}
            <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                  <Home className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
                  {t("Thói quen ở phòng")}
                </h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  {t("5. Bạn có thường xuyên nấu ăn không?")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.cooking ?? ""}
                    onChange={(e) => setNumberField("cooking", e.target.value)}
                  >
                    {canShowBlankOption("cooking") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.cooking.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("6. Tần suất dẫn bạn bè về phòng của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.guest ?? ""}
                    onChange={(e) => setNumberField("guest", e.target.value)}
                  >
                    {canShowBlankOption("guest") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.guest.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("7. Tần suất ở trong phòng của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.home_frequency ?? ""}
                    onChange={(e) => setNumberField("home_frequency", e.target.value)}
                  >
                    {canShowBlankOption("home_frequency") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.home_frequency.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("8. Thời gian làm việc của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.work_schedule ?? ""}
                    onChange={(e) => setTextField("work_schedule", e.target.value)}
                  >
                    {canShowBlankOption("work_schedule") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.work_schedule.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>
              </div>
            </section>

            {/* Section 3: Môi trường sống chung */}
            <section className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-container)]">
                  <Users className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: "var(--font-main)" }}>
                  {t("Môi trường sống chung")}
                </h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  {t("9. Mức độ chia sẻ đồ dùng của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.sharing ?? ""}
                    onChange={(e) => setNumberField("sharing", e.target.value)}
                  >
                    {canShowBlankOption("sharing") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.sharing.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("10. Mức độ yên tĩnh trong không gian chung của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.noise ?? ""}
                    onChange={(e) => setNumberField("noise", e.target.value)}
                  >
                    {canShowBlankOption("noise") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.noise.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("11. Tần suất gọi điện/video call trong phòng của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.call_frequency ?? ""}
                    onChange={(e) => setNumberField("call_frequency", e.target.value)}
                  >
                    {canShowBlankOption("call_frequency") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.call_frequency.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  {t("12. Mức độ chơi game dùng mic hoặc voice chat trong phòng của bạn")}
                  <select
                    className="mt-2 w-full rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                    value={form.game_mic ?? ""}
                    onChange={(e) => setNumberField("game_mic", e.target.value)}
                  >
                    {canShowBlankOption("game_mic") && <option value="">{t("Bỏ trống")}</option>}
                    {PROFILE_OPTIONS.game_mic.map((o) => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                  </select>
                </label>
              </div>
            </section>
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            {/* Gợi ý dành cho bạn */}
            <div className="rounded-[var(--radius-md)] bg-gradient-to-br from-[#8B5E34] to-[#6B3F1D] p-6 text-white">
              <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-main)" }}>{t("Gợi ý dành cho bạn")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                {t("Hoàn thành 100% hồ sơ để chúng tôi hiện thị những người bạn cùng phòng có độ tương thích cao nhất trên 90%.")}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-[var(--primary)]/30 bg-white/20" />
                  ))}
                </div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">+12</span>
                <span className="ml-1 text-xs text-white/70">{t("Đang chờ bạn kết nối")}</span>
              </div>
            </div>

            {/* Mẹo nhỏ */}
            <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-5">
              <h4 className="text-sm font-bold text-[var(--on-surface)]">{t("Mẹo nhỏ")}</h4>
              <div className="mt-3 space-y-3">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-container)]">
                    <Lightbulb className="h-3.5 w-3.5 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("Trung thực về thói quen giúp tránh các xung đột không đáng có sau này.")}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-container)]">
                    <Lightbulb className="h-3.5 w-3.5 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {t("Bạn có thể thay đổi các tiêu chí này bất cứ lúc nào trong cài đặt.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Image card */}
            <div className="relative overflow-hidden rounded-[var(--radius-md)]">
              <img
                src="https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400&h=250&fit=crop"
                alt={t("Không gian sống")}
                className="h-44 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <p className="absolute bottom-3 left-4 text-sm font-bold text-white">{t("Tìm không gian sống mơ ước")}</p>
            </div>
          </div>
        </form>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-4 border-t border-slate-100 pt-6 pb-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
          >
            {t("Bỏ qua lúc này")}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full rounded-full bg-[var(--primary)] px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-[var(--primary)]/30 transition hover:opacity-90 active:scale-[0.98] sm:w-auto disabled:opacity-60"
          >
            {saving ? t("Đang lưu...") : t("Lưu & Tiếp tục")}
          </button>
        </div>
      </div>
    </UserShell>
  );
}
