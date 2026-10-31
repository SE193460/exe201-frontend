import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { verifyEmail } from "../api/services/auth";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState(t("Đang xử lý..."));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setStatus(t("Không tìm thấy token xác nhận."));
      return;
    }

    verifyEmail(token)
      .then((response) => {
        if (response.message === "Email already verified") {
          setStatus(t("Email đã được xác nhận trước đó. Hãy đăng nhập."));
          return;
        }
        setStatus(t("Xác nhận email thành công. Hãy quay lại đăng nhập."));
      })
      .catch(() => setStatus(t("Token không hợp lệ hoặc đã hết hạn.")));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white px-6 py-10 text-center shadow-lg">
        <h1 className="text-2xl font-semibold text-slate-800">{t("Xác nhận email")}</h1>
        <p className="mt-4 text-sm text-slate-600">{status}</p>
        <a
          href="/auth"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#ff6a3d] to-[#ff9854] px-6 py-3 text-sm font-semibold text-white"
        >
          {t("Quay lại trang đăng nhập")}
        </a>
      </div>
    </div>
  );
}
