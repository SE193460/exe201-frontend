import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login, register } from "../api/services/auth";
import { fetchProfile, getOnboardingStorageKey } from "../api/services/user";
import { fetchLifestyleProfile, fetchRoommatePreferences } from "../api/services/lifestyle";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nhập họ và tên"),
    username: z.string().min(3, "Tên đăng nhập tối thiểu 3 ký tự").or(z.literal("")).optional(),
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
      let loggedInUserId = "";
      try {
        const profile = await fetchProfile();
        loggedInUserId = profile.id;
        if (profile.roleName === "admin") {
          navigate("/admin/dashboard");
          return;
        }
      } catch {
        // ignore profile error
      }

      if (!loggedInUserId) {
        navigate("/onboarding");
        return;
      }
      const onboardingKey = getOnboardingStorageKey(loggedInUserId);
      const alreadyCompleted = localStorage.getItem(onboardingKey) === "true";
      if (!alreadyCompleted) {
        try {
          const [lifestyleProfile, roommatePreferences] = await Promise.all([
            fetchLifestyleProfile(),
            fetchRoommatePreferences(),
          ]);
          const hasLifestyleData = Object.values(lifestyleProfile || {}).some((value) => value !== null && value !== undefined && value !== "");
          const hasPreferencesData = Object.values(roommatePreferences || {}).some((value) => value !== null && value !== undefined && value !== "");
          if (!hasLifestyleData && !hasPreferencesData) {
            navigate("/onboarding");
            return;
          }
        } catch {
          navigate("/onboarding");
          return;
        }
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
        fullName: values.fullName,
        username: values.username || undefined,
        email: values.email,
        password: values.password,
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
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col overflow-hidden lg:min-h-[92vh] lg:flex-row">
        {/* Left Panel - Hero Image */}
        <section className="relative hidden w-full lg:flex lg:w-[48%]">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=900&fit=crop"
            alt="Living room"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-10">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xl font-extrabold text-white"
              style={{ fontFamily: "var(--font-main)" }}
            >
              Roomie
            </button>
            <div>
              <h1 className="text-3xl font-extrabold leading-tight text-white md:text-4xl" style={{ fontFamily: "var(--font-main)" }}>
                Tìm người ở ghép<br />hoàn hảo.
              </h1>
              <p className="mt-4 max-w-sm text-sm text-white/80">
                Tham gia cùng hơn 10.000+ người dùng đang tìm kiếm không gian sống lý tưởng và những người bạn đồng hành tin cậy tại Roomie.
              </p>
              <div className="mt-6 space-y-3 text-sm text-white/90">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                  <span>Hồ sơ được xác thực 100%</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span>Thuật toán ghép nối thông minh</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Trò chuyện an toàn trực tiếp</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel - Form */}
        <section className="flex w-full flex-1 items-center justify-center bg-white px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mb-8 text-xl font-extrabold text-slate-900 lg:hidden"
              style={{ fontFamily: "var(--font-main)" }}
            >
              Roomie
            </button>

            {mode === "register" ? (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Tạo tài khoản mới</h2>
                <p className="mt-1 text-sm text-slate-500">Bắt đầu hành trình tìm kiếm roomie của bạn ngay hôm nay.</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Đăng nhập</h2>
                <p className="mt-1 text-sm text-slate-500">Chào mừng bạn quay lại Roomie.</p>
              </>
            )}

            {status && <p className="mt-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 border border-green-200">{status}</p>}
            {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">{error}</p>}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative mt-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input
                      type="email"
                      className={`w-full rounded-lg border pl-10 pr-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] ${
                        loginForm.formState.errors.email ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                      placeholder="ban@example.com"
                      {...loginForm.register("email")}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                  <div className="relative mt-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type="password"
                      className={`w-full rounded-lg border pl-10 pr-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] ${
                        loginForm.formState.errors.password ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                      placeholder="••••••••"
                      {...loginForm.register("password")}
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  Đăng nhập
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Họ và tên</label>
                  <div className="relative mt-1.5">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input
                      type="text"
                      className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] ${
                        registerForm.formState.errors.fullName ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                      placeholder="Nguyễn Văn A"
                      {...registerForm.register("fullName")}
                    />
                  </div>
                  {registerForm.formState.errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tên đăng nhập <span className="text-slate-400 font-normal">(tuỳ chọn)</span></label>
                  <div className="relative mt-1.5">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] bg-white"
                      placeholder="vd: minh_hanoi"
                      {...registerForm.register("username")}
                    />
                  </div>
                  {registerForm.formState.errors.username && (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.username.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative mt-1.5">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <input
                      type="email"
                      className={`w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] ${
                        registerForm.formState.errors.email ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                      placeholder="example@gmail.com"
                      {...registerForm.register("email")}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                  <div className="relative mt-1.5">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      className={`w-full rounded-lg border pl-10 pr-12 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] ${
                        registerForm.formState.errors.password ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                      placeholder="••••••••"
                      {...registerForm.register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      aria-label={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showRegisterPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showRegisterPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
                  <div className="relative mt-1.5">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      className={`w-full rounded-lg border pl-10 pr-12 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] ${
                        registerForm.formState.errors.confirmPassword ? "border-red-300 bg-red-50/30" : "border-slate-200 bg-white"
                      }`}
                      placeholder="••••••••"
                      {...registerForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                      aria-label={showRegisterConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      title={showRegisterConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showRegisterConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]" />
                  <span>Tôi đồng ý với <a href="#" className="font-semibold text-[var(--primary)] hover:underline">Điều khoản & Điều kiện</a> và <a href="#" className="font-semibold text-[var(--primary)] hover:underline">Chính sách bảo mật</a> của Roomie.</span>
                </label>
                <button
                  type="submit"
                  className="mt-1 w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
                >
                  Đăng ký
                </button>
              </form>
            )}

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>{mode === "register" ? "Hoặc đăng ký bằng" : "Hoặc đăng nhập bằng"}</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${apiBase}/api/auth/google`; }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Tiếp tục với Google
            </button>

            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === "login" ? (
                <>Bạn đã có tài khoản? <button onClick={() => setMode("register")} className="font-semibold text-[var(--primary)] hover:underline">Đăng ký</button></>
              ) : (
                <>Bạn đã có tài khoản? <button onClick={() => setMode("login")} className="font-semibold text-[var(--primary)] hover:underline">Đăng nhập</button></>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
