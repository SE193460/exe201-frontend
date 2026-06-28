import { useEffect, useState } from "react";
import UserShell from "../layouts/UserShell";
import {
  fetchLifestyleProfile,
  updateLifestyleProfile,
} from "../api/services/lifestyle";
import type { LifestyleProfile } from "../api/services/lifestyle";
import { PROFILE_OPTIONS } from "./lifestyleOptions";
import { trackEvent } from "../api/services/analytics";

function selectClassName() {
  return "mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300";
}

export default function LifestyleProfilePage() {
  const [form, setForm] = useState<LifestyleProfile>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLifestyleProfile()
      .then((profile) => {
        setForm(profile || {});
      })
      .catch(() => {
        setError("Không thể tải hồ sơ lối sống.");
      })
      .finally(() => setLoading(false));
  }, []);

  const setNumberField = (field: keyof LifestyleProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : Number(value) }));
  };

  const setTextField = (field: keyof LifestyleProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("");
    setError("");
    setSaving(true);
    try {
      const saved = await updateLifestyleProfile(form);
      setForm(saved);
      trackEvent({ eventName: "lifestyle_profile_updated" });
      setStatus("Đã lưu hồ sơ lối sống.");
    } catch {
      setError("Lưu hồ sơ thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UserShell>
        <div className="mx-auto max-w-[820px] rounded-[28px] border border-orange-100 bg-white p-8">Đang tải...</div>
      </UserShell>
    );
  }

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[820px] rounded-[28px] border border-orange-100 bg-white p-8 shadow-[0_25px_80px_-40px_rgba(255,115,0,0.6)]">
        <h1 className="text-2xl font-bold">Hồ sơ lối sống</h1>
        <p className="mt-2 text-sm text-slate-500">Điền thông tin để hệ thống đề xuất bạn cùng phòng phù hợp hơn.</p>

        {status && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{status}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={submit} className="mt-6 space-y-8">
          <section className="space-y-4 rounded-2xl border border-orange-100 p-5">
            <h2 className="text-base font-semibold">Sinh hoạt cơ bản</h2>

            <label className="block text-sm font-medium text-slate-700">
              1. Mức độ sạch sẽ của bạn 
              <select className={selectClassName()} value={form.cleanliness ?? ""} onChange={(e) => setNumberField("cleanliness", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.cleanliness.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              2. Tần suất dùng điều hòa của bạn 
              <select className={selectClassName()} value={form.ac_usage ?? ""} onChange={(e) => setNumberField("ac_usage", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.ac_usage.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                3. Bạn có nuôi thú cưng không?
                <select className={selectClassName()} value={form.pet_status ?? ""} onChange={(e) => setNumberField("pet_status", e.target.value)}>
                  <option value="">Bỏ trống</option>
                  {PROFILE_OPTIONS.binary.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                4. Bạn có hút thuốc không?
                <select className={selectClassName()} value={form.smoking_status ?? ""} onChange={(e) => setNumberField("smoking_status", e.target.value)}>
                  <option value="">Bỏ trống</option>
                  {PROFILE_OPTIONS.binary.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-orange-100 p-5">
            <h2 className="text-base font-semibold">Thói quen ở phòng</h2>

            <label className="block text-sm font-medium text-slate-700">
              5. Bạn có thường xuyên nấu ăn không?
              <select className={selectClassName()} value={form.cooking ?? ""} onChange={(e) => setNumberField("cooking", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.cooking.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              6. Tần suất dẫn bạn bè về phòng của bạn 
              <select className={selectClassName()} value={form.guest ?? ""} onChange={(e) => setNumberField("guest", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.guest.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              7. Tần suất ở trong phòng của bạn
              <select className={selectClassName()} value={form.home_frequency ?? ""} onChange={(e) => setNumberField("home_frequency", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.home_frequency.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              8. Thời gian làm việc của bạn 
              <select className={selectClassName()} value={form.work_schedule ?? ""} onChange={(e) => setTextField("work_schedule", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.work_schedule.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-orange-100 p-5">
            <h2 className="text-base font-semibold">Môi trường sống chung</h2>

            <label className="block text-sm font-medium text-slate-700">
              9. Mức độ chia sẻ đồ dùng của bạn
              <select className={selectClassName()} value={form.sharing ?? ""} onChange={(e) => setNumberField("sharing", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.sharing.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              10. Mức độ yên tĩnh trong không gian chung của bạn
              <select className={selectClassName()} value={form.noise ?? ""} onChange={(e) => setNumberField("noise", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.noise.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              11. Tần suất gọi điện/video call trong phòng của bạn
              <select className={selectClassName()} value={form.call_frequency ?? ""} onChange={(e) => setNumberField("call_frequency", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.call_frequency.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              12. Mức độ chơi game dùng mic hoặc voice chat trong phòng của bạn
              <select className={selectClassName()} value={form.game_mic ?? ""} onChange={(e) => setNumberField("game_mic", e.target.value)}>
                <option value="">Bỏ trống</option>
                {PROFILE_OPTIONS.game_mic.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 disabled:opacity-70"
          >
            {saving ? "Đang lưu..." : "Lưu hồ sơ lối sống"}
          </button>
        </form>
      </div>
    </UserShell>
  );
}
