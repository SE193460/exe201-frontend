import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { changePassword, fetchProfile, resolveAvatarUrl, updateProfile, uploadAvatar } from "../api/services/user";
import { useNavigate } from "react-router-dom";
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

  return (
    <UserShell>
      <div className="mx-auto w-full max-w-[720px] rounded-[28px] border border-orange-100 bg-white p-8 shadow-[0_25px_80px_-40px_rgba(255,115,0,0.6)]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cập nhật hồ sơ</h1>
          <button
            className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={() => navigate("/home")}
          >
            Quay lại trang chủ
          </button>
        </div>

        {status && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{status}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Họ và tên
            <input
              type="text"
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="Nguyễn Văn A"
              {...form.register("fullName")}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Tên đăng nhập
            <input
              type="text"
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="vd: minh_hanoi"
              {...form.register("username")}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Số điện thoại
            <input
              type="tel"
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
              placeholder="VD: 0901234567"
              {...form.register("phoneNumber")}
            />
          </label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-orange-100 bg-orange-50">
              {avatarPreview ? (
                <img src={resolveAvatarUrl(avatarPreview)} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-orange-400">
                  Chưa có
                </div>
              )}
            </div>
            <label className="flex flex-1 flex-col text-sm font-medium text-slate-700">
              Ảnh đại diện
              <input
                type="file"
                accept="image/*"
                className="mt-2 w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-300"
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
          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
          >
            Lưu thay đổi
          </button>
        </form>

        <div className="mt-10 border-t border-orange-100 pt-8">
          <h2 className="text-xl font-bold">Đổi mật khẩu</h2>
          <p className="mt-1 text-sm text-slate-500">Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>

          {passwordStatus && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{passwordStatus}</p>}
          {passwordError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{passwordError}</p>}

          <form onSubmit={onChangePassword} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Mật khẩu hiện tại
              <div className="relative mt-2">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-orange-300"
                  placeholder="Nhập mật khẩu hiện tại"
                  {...passwordForm.register("currentPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-600 hover:bg-slate-100"
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
                  className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-orange-300"
                  placeholder="Nhập mật khẩu mới"
                  {...passwordForm.register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-600 hover:bg-slate-100"
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
                  className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-3 pr-20 text-sm outline-none transition focus:border-orange-300"
                  placeholder="Nhập lại mật khẩu mới"
                  {...passwordForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-600 hover:bg-slate-100"
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
              className="mt-2 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200"
            >
              Cập nhật mật khẩu
            </button>
          </form>
        </div>
      </div>
    </UserShell>
  );
}
