import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login, register } from "../api/services/auth";
import { fetchProfile } from "../api/services/user";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nhập họ và tên"),
    username: z.string().refine((val) => val === "" || val.length >= 3, { message: "Tên đăng nhập tối thiểu 3 ký tự" }).optional(),
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Mật khẩu tối thiểu 8 ký tự")
      .regex(/[a-z]/, "Mật khẩu cần có chữ thường")
      .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa")
      .regex(/\d/, "Mật khẩu cần có số")
      .regex(/[^A-Za-z\d]/, "Mật khẩu cần có ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const queryMessage = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "google") {
      const token = params.get("accessToken");
      if (token) {
        localStorage.setItem("access_token", token);
        setTimeout(async () => {
          try {
            const profile = await fetchProfile();
            if (profile.roleName === "admin") {
              navigate("/admin/dashboard");
              return;
            }
          } catch {
            // ignore profile error
          }
          navigate("/");
        }, 300);
        return "";
      }
    }
    if (params.get("error") === "google") {
      return "Đăng nhập Google thất bại.";
    }
    if (params.get("error") === "inactive") {
      return "Tài khoản đã bị vô hiệu hóa.";
    }
    return "";
  }, []);

  useEffect(() => {
    if (queryMessage) {
      setStatus(queryMessage);
    }
  }, [queryMessage]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLogin = loginForm.handleSubmit(async (values) => {
    setError("");
    setStatus("");
    try {
      const result = await login(values);
      localStorage.setItem("access_token", result.accessToken);
      setStatus("Đăng nhập thành công.");
      try {
        const profile = await fetchProfile();
        if (profile.roleName === "admin") {
          navigate("/admin/dashboard");
          return;
        }
      } catch {
        // ignore profile error
      }
      navigate("/");
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (message === "Account is inactive") {
        setError("Tài khoản đã bị vô hiệu hóa.");
        return;
      }
      setError("Sai email hoặc mật khẩu.");
    }
  });

  const handleRegister = registerForm.handleSubmit(async (values) => {
    setError("");
    setStatus("");
    try {
      await register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        username: values.username || undefined,
      });
      setStatus("Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư.");
    }catch (err: any) {
        console.error(err);

        setError(
          err?.response?.data?.message ||
          "Đăng ký thất bại. Vui lòng thử lại."
        );
      }
    });

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col overflow-hidden rounded-[28px] border border-orange-100 bg-white shadow-[0_25px_80px_-40px_rgba(255,115,0,0.6)] lg:min-h-[92vh] lg:flex-row">
        <section className="relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#ff6a3d] via-[#ff7b44] to-[#ffa75b] px-10 py-12 text-white lg:w-[48%]">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3), transparent 45%)",
          }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15">🏠</span>
                RoomMate
              </button>
            </div>
            <h1 className="mt-12 text-4xl font-extrabold leading-tight md:text-5xl">
              Tìm người ở ghép<br />hợp gu, hợp túi tiền.
            </h1>
            <p className="mt-5 max-w-sm text-sm text-white/90 md:text-base">
              Hơn 10.000 bạn trẻ đang tìm bạn cùng phòng tại Hà Nội, Sài Gòn, Đà Nẵng. Chỉ vài phút để bắt đầu.
            </p>
          </div>
          <div className="relative z-10 mt-10 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-3 rounded-full bg-white/15 px-4 py-2">
              <span className="text-lg">👥</span>
              <div>
                <p className="text-base font-semibold">10k+</p>
                <p className="text-xs text-white/80">Thành viên</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-white/15 px-4 py-2">
              <span className="text-lg">❤</span>
              <div>
                <p className="text-base font-semibold">3.2k</p>
                <p className="text-xs text-white/80">Ghép thành công</p>
              </div>
            </div>
          </div>
          <p className="relative z-10 mt-10 text-xs text-white/70">© 2026 RoomMate Vietnam</p>
        </section>

        <section className="flex w-full flex-1 items-center justify-center bg-gradient-to-br from-white via-white to-[#fff7f1] px-6 py-12">
          <div className="w-full max-w-md rounded-[24px] border border-orange-100 bg-white/90 p-8 shadow-[0_20px_50px_-30px_rgba(255,136,0,0.5)]">
            <div className="mb-8 flex rounded-full bg-[#f3efe9] p-1 text-sm font-semibold text-slate-600">
              <button
                className={`flex-1 rounded-full px-4 py-2 transition ${mode === "login" ? "bg-white text-slate-900 shadow" : "opacity-70"
                  }`}
                onClick={() => setMode("login")}
                type="button"
              >
                Đăng nhập
              </button>
              <button
                className={`flex-1 rounded-full px-4 py-2 transition ${mode === "register" ? "bg-white text-slate-900 shadow" : "opacity-70"
                  }`}
                onClick={() => setMode("register")}
                type="button"
              >
                Đăng ký
              </button>
            </div>

            {status && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{status}</p>}
            {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-orange-300 ${
                      loginForm.formState.errors.email ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                    }`}
                    placeholder="ban@example.com"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">⚠ {loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                  <input
                    type="password"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-orange-300 ${
                      loginForm.formState.errors.password ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                    }`}
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500">⚠ {loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
                >
                  Đăng nhập
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Tên đăng nhập <span className="text-slate-400 font-normal">(tuỳ chọn)</span>
                  </label>
                  <input
                    type="text"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-orange-300 ${
                      registerForm.formState.errors.username ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                    }`}
                    placeholder="vd: minh_hanoi"
                    {...registerForm.register("username")}
                  />
                  {registerForm.formState.errors.username && (
                    <p className="mt-1 text-xs text-red-500">⚠ {registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Họ và tên <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-orange-300 ${
                      registerForm.formState.errors.fullName ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                    }`}
                    placeholder="Trần Minh"
                    {...registerForm.register("fullName")}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">⚠ {registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email <span className="text-red-400">*</span></label>
                  <input
                    type="email"
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-orange-300 ${
                      registerForm.formState.errors.email ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                    }`}
                    placeholder="ban@example.com"
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">⚠ {registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mật khẩu <span className="text-red-400">*</span></label>
                  <div className="relative mt-2">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      className={`w-full rounded-2xl border px-4 py-3 pr-20 text-sm outline-none transition focus:border-orange-300 ${
                        registerForm.formState.errors.password ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                      }`}
                      placeholder="••••••••"
                      {...registerForm.register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-600 hover:bg-slate-100"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      aria-label={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showRegisterPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500">⚠ {registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nhập lại mật khẩu <span className="text-red-400">*</span></label>
                  <div className="relative mt-2">
                    <input
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      className={`w-full rounded-2xl border px-4 py-3 pr-20 text-sm outline-none transition focus:border-orange-300 ${
                        registerForm.formState.errors.confirmPassword ? "border-red-300 bg-red-50/30" : "border-orange-100 bg-white"
                      }`}
                      placeholder="••••••••"
                      {...registerForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-600 hover:bg-slate-100"
                      onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                      aria-label={showRegisterConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showRegisterConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showRegisterConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">⚠ {registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
                >
                  Tạo tài khoản
                </button>
              </form>
            )}

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              HOAC
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = `${apiBase}/api/auth/google`;
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
            >
              <span className="text-lg">G</span>
              Tiếp tục với Google
            </button>

            <p className="mt-5 text-center text-xs text-slate-400">
              Bằng việc tiếp tục, bạn đồng ý với điều khoản và chính sách của RoomMate.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
