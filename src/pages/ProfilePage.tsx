import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { fetchProfile, updateProfile, uploadAvatar } from "../api/services/user";
import { useNavigate } from "react-router-dom";

const profileSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ và tên"),
  username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự").optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      username: "",
    },
  });

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        form.reset({
          fullName: profile.fullName,
          username: profile.username || "",
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
      });
      setStatus("Cập nhật hồ sơ thành công.");
    } catch {
      setError("Cập nhật thất bại. Vui lòng thử lại.");
    }
  });

  return (
    <div className="min-h-screen bg-[#fff7f2] px-6 py-10 text-slate-800">
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
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-orange-100 bg-orange-50">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
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
      </div>
    </div>
  );
}
