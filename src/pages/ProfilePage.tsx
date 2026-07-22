import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { changePassword, fetchProfile, getOnboardingStorageKey, resolveAvatarUrl, updateProfile, uploadAvatar } from "../api/services/user";
import { updateLifestyleProfile, updateRoommatePreferences } from "../api/services/lifestyle";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import UserShell from "../layouts/UserShell";

const profileSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ và tên"),
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự").optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine((value) => !value || /^(\+?\d[\d\s.-]{7,20})$/.test(value), "Số điện thoại không hợp lệ"),
});

type ProfileForm = z.infer<typeof profileSchema>;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự")
      .regex(/[a-z]/, "Mật khẩu mới cần có chữ thường")
      .regex(/[A-Z]/, "Mật khẩu mới cần có chữ hoa")
      .regex(/\d/, "Mật khẩu mới cần có số")
      .regex(/[^A-Za-z\d]/, "Mật khẩu mới cần có ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.3 10.3 0 0 1 12 4c7 0 11 8 11 8a19.7 19.7 0 0 1-5 5.8" />
      <path d="M6.6 6.6A20 20 0 0 0 1 12s4 8 11 8a10.8 10.8 0 0 0 5.4-1.4" />
    </svg>
  );
}

export default function ProfilePage() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [passwordStatus, setPasswordStatus] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);
  const [resetStatus, setResetStatus] = useState<string>("");
  const navigate = useNavigate();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      username: "",
      phoneNumber: "",
    },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        form.reset({
          fullName: profile.fullName,
          username: profile.username || "",
          phoneNumber: profile.phoneNumber || "",
        });
        setAvatarPreview(profile.avatarUrl || "");
      })
      .catch(() => {
        setError("Không thể tải hồ sơ. Vui lòng đăng nhập lại.");
      });
  }, [form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus("");
    setError("");
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        const uploadResult = await uploadAvatar(avatarFile);
        avatarUrl = uploadResult.avatarUrl;
        setAvatarPreview(uploadResult.avatarUrl);
        setAvatarFile(null);
      }
      await updateProfile({
        fullName: values.fullName,
        username: values.username || null,
        avatarUrl: avatarUrl || null,
        phoneNumber: values.phoneNumber || null,
      });
      setStatus("Cập nhật hồ sơ thành công.");
    } catch {
      setError("Cập nhật thất bại. Vui lòng thử lại.");
    }
  });

  const onChangePassword = passwordForm.handleSubmit(async (values) => {
    setPasswordStatus("");
    setPasswordError("");
    try {
      const result = await changePassword(values);
      setPasswordStatus(result.message || "Đổi mật khẩu thành công.");
      passwordForm.reset();
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPasswordError(message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
    }
  });

  const handleResetOnboarding = async () => {
    setResettingOnboarding(true);
    setResetStatus("");
    try {
      // Clear onboarding flag
      const profile = await fetchProfile();
      const onboardingKey = getOnboardingStorageKey(profile.id);
      localStorage.removeItem(onboardingKey);

      // Reset lifestyle profile data
      await updateLifestyleProfile({
        cleanliness: null,
        ac_usage: null,
        pet_status: null,
        smoking_status: null,
        cooking: null,
        guest: null,
        home_frequency: null,
        work_schedule: null,
        sharing: null,
        noise: null,
        call_frequency: null,
        game_mic: null,
      });

      // Reset roommate preferences data
      await updateRoommatePreferences({
        pref_cleanliness: null,
        pref_ac_usage: null,
        pref_cooking: null,
        pref_guest: null,
        pref_home_frequency: null,
        pref_noise: null,
        pref_call_frequency: null,
        pref_game_mic: null,
        pref_pet: null,
        pref_smoking: null,
        pref_work_schedule: null,
        pref_sharing: null,
      });

      setResetStatus("Đã reset onboarding. Đang chuyển hướng...");
      setTimeout(() => {
        navigate("/onboarding");
      }, 1000);
    } catch (err) {
      console.error("Reset onboarding error:", err);
      setResetStatus("Lỗi khi reset onboarding. Vui lòng thử lại.");
    } finally {
      setResettingOnboarding(false);
    }
  };

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[720px] space-y-6">
        {/* Breadcrumb */}
        <nav className="text-xs text-slate-400">
          <span className="hover:underline cursor-pointer" onClick={() => navigate("/")}>HOME</span>
          <span className="mx-1.5">/</span>
          <span className="hover:underline cursor-pointer" onClick={() => navigate("/settings")}>SETTINGS</span>
          <span className="mx-1.5">/</span>
          <span className="font-semibold text-slate-600">UPDATE PROFILE</span>
        </nav>

        {/* Profile Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-container)]">
                <svg className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Cập nhật hồ sơ</h1>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              onClick={() => navigate("/")}
            >
              Quay lại trang chủ
            </button>
          </div>

          {status && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">{status}</p>}
          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">{error}</p>}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Họ và tên
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Quản trị viên"
                  {...form.register("fullName")}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Tên đăng nhập
                <input
                  type="text"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="vd: minh_hanoi"
                  {...form.register("username")}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Số điện thoại
              <input
                type="tel"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                placeholder="0842494586"
                {...form.register("phoneNumber")}
              />
            </label>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Ảnh đại diện</p>
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-white">
                  {avatarPreview ? (
                    <img src={resolveAvatarUrl(avatarPreview)} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                      Chưa có
                    </div>
                  )}
                </div>
                <label className="flex flex-1 items-center gap-3 cursor-pointer">
                  <span className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition">
                    Choose File
                  </span>
                  <span className="text-sm text-slate-400">
                    {avatarFile ? avatarFile.name : "No file chosen"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setAvatarFile(file);
                      if (file) {
                        const previewUrl = URL.createObjectURL(file);
                        setAvatarPreview(previewUrl);
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Lưu thay đổi
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-container)]">
              <svg className="h-5 w-5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Đổi mật khẩu</h2>
          </div>
          <p className="text-sm text-slate-500 ml-[52px]">Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>

          {passwordStatus && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">{passwordStatus}</p>}
          {passwordError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">{passwordError}</p>}

          <form onSubmit={onChangePassword} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu hiện tại
              <div className="relative mt-2">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Nhập mật khẩu hiện tại"
                  {...passwordForm.register("currentPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <span className="mt-1 block text-xs text-red-600">{passwordForm.formState.errors.currentPassword.message}</span>
              )}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu mới
              <div className="relative mt-2">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Nhập mật khẩu mới"
                  {...passwordForm.register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <span className="mt-1 block text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</span>
              )}
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Xác nhận mật khẩu mới
              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition focus:border-[var(--primary)]"
                  placeholder="Nhập lại mật khẩu mới"
                  {...passwordForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <span className="mt-1 block text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</span>
              )}
            </label>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>

        {/* Reset Onboarding Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-container)]">
              <RotateCcw className="h-5 w-5 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Lại làm onboarding</h2>
          </div>
          <p className="text-sm text-slate-500 ml-[52px]">Bạn có thể làm lại quy trình setup hồ sơ để thay đổi tùy chọn lifestyle và soft-filter preferences.</p>

          {resetStatus && (
            <p className={`mt-4 rounded-lg px-4 py-2 text-sm border ${resetStatus.includes("Lỗi") ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
              {resetStatus}
            </p>
          )}

          <button
            onClick={handleResetOnboarding}
            disabled={resettingOnboarding}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border-2 border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            {resettingOnboarding ? "Đang reset..." : "Reset Onboarding"}
          </button>
        </div>
      </div>
    </UserShell>
  );
}
