import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../api/services/user";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function HomePage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const token = params.get("accessToken");
    const errorParam = params.get("error");

    if (success === "google" && token) {
      localStorage.setItem("access_token", token);
      fetchProfile()
        .then((profile) => {
          if (profile.roleName === "admin") {
            navigate("/admin/dashboard", { replace: true });
            return;
          }
          navigate("/", { replace: true });
        })
        .catch(() => {
          // ignore profile error
          navigate("/", { replace: true });
        })
      return;
    }

    if (errorParam) {
      setError(errorParam === "inactive" ? "Tài khoản đã bị vô hiệu hóa." : "Đăng nhập Google thất bại.");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800 flex flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-12 px-6 pb-16 pt-10">
        {(status || error) && (
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm">
            <span className={error ? "text-red-600" : "text-green-700"}>{error || status}</span>
          </div>
        )}
        <section className="rounded-[32px] bg-gradient-to-br from-[#fff2e8] via-[#fff7f3] to-[#ffece1] px-6 py-12 text-center shadow-[0_25px_60px_-45px_rgba(255,115,0,0.45)] md:px-14">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
            ✨ Mới ra mắt
          </span>
          <h1 className="mt-6 text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">
            Tìm bạn ở ghép
            <span className="block text-[#ff6a3d]">hợp gu, hợp túi tiền.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base">
            Kết nối với hàng ngàn bạn trẻ đang tìm phòng cùng bạn tại các thành phố lớn ở Việt Nam.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-6 rounded-full bg-[#ff6a3d] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200"
          >
            Bắt đầu miễn phí
          </button>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            { title: "Cộng đồng lớn", desc: "10.000+ thành viên đã xác minh.", icon: "👥" },
            { title: "Khắp Việt Nam", desc: "Hà Nội, Sài Gòn, Đà Nẵng và hơn thế.", icon: "📍" },
            { title: "Ghép thông minh", desc: "Lọc theo ngân sách, lối sống, khu vực.", icon: "✨" },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[22px] border border-orange-100 bg-white px-6 py-6 text-left shadow-[0_20px_50px_-30px_rgba(255,136,0,0.5)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-lg">
                {card.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-800">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{card.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}
