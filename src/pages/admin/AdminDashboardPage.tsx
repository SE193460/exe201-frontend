import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/services/auth";
import { fetchAdminListings, fetchUsers } from "../../api/services/admin";

const quickLinks = [
  {
    title: "Quản lý người dùng",
    description: "Xem danh sách tài khoản, trạng thái hoạt động.",
    path: "/admin/users",
    accent: "bg-orange-100 text-orange-700",
  },
  {
    title: "Quản lý bài đăng",
    description: "Duyệt và kiểm soát bài đăng phòng ở ghép.",
    path: "/admin/listings",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "Quản lý tiện nghi",
    description: "Tạo, cập nhật tiện nghi hiển thị cho bài đăng.",
    path: "/admin/amenities",
    accent: "bg-rose-100 text-rose-700",
  },
  {
    title: "Quản lý thanh toán",
    description: "Xem lịch sử giao dịch và thanh toán",
    path: "/admin/payments",
    accent: "bg-blue-100 text-blue-700"
  },

  {
    title: "Báo cáo hệ thống",
    description: "Xem danh sách báo cáo từ người dùng",
    path: "/admin/reports",
    accent: "bg-red-100 text-red-700"
  }
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeUsers, setActiveUsers] = useState(0);
  const [pendingListings, setPendingListings] = useState(0);
  const [rejectedListings, setRejectedListings] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchUsers({ status: "all" }),
      fetchAdminListings(),
    ])
      .then(([users, listings]) => {
        if (!isMounted) return;
        setActiveUsers(users.filter((user) => user.isActive).length);
        setPendingListings(listings.filter((listing) => listing.status === "PENDING").length);
        setRejectedListings(listings.filter((listing) => listing.status === "REJECTED").length);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Không thể tải dữ liệu dashboard.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "Tài khoản đang hoạt động",
        value: loading ? "--" : activeUsers.toString(),
        trend: loading ? "Đang tải..." : "Cập nhật gần nhất",
      },
      {
        label: "Bài đăng chờ duyệt",
        value: loading ? "--" : pendingListings.toString(),
        trend: loading ? "Đang tải..." : "Cập nhật gần nhất",
      },
      {
        label: "Bài đăng bị từ chối",
        value: loading ? "--" : rejectedListings.toString(),
        trend: loading ? "Đang tải..." : "Cập nhật gần nhất",
      },
    ],
    [activeUsers, loading, pendingListings, rejectedListings]
  );

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("access_token");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f2] text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <aside className="w-full max-w-[250px] rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6a3d] text-white">🏠</span>
              RoomMate Admin
            </div>
            <div className="mt-8 space-y-2 text-sm font-semibold">
              <button
                onClick={() => navigate("/home")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Trang chủ
              </button>
              <button
                className="w-full rounded-full bg-orange-100 px-4 py-2 text-left text-orange-700"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Quản lý người dùng
              </button>
              <button
                onClick={() => navigate("/admin/listings")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Quản lý bài đăng
              </button>
              <button
                onClick={() => navigate("/admin/imported-listings")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Quản lý nguồn bài đăng
              </button>
              <button
                onClick={() => navigate("/admin/amenities")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Quản lý tiện nghi
              </button>
              <button
                onClick={() => navigate("/admin/payments")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Quản lý thanh toán
              </button>

              <button
                onClick={() => navigate("/admin/reports")}
                className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
              >
                Báo cáo
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50"
          >
            Đăng xuất
          </button>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-500">Bảng điều khiển</p>
                <h1 className="text-2xl font-bold">Tổng quan quản trị</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi nhanh các khu vực quản lý quan trọng.</p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-orange-50"
              >
                Về trang chủ
              </button>
            </div>
          </section>

          {error && (
            <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
              {error}
            </section>
          )}

          <section className="grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(255,136,0,0.35)]"
              >
                <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-800">{card.value}</p>
                <p className="mt-2 text-xs text-slate-400">{card.trend}</p>
              </div>
            ))}
          </section>

          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <h2 className="text-lg font-semibold text-slate-800">Truy cập nhanh</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  onClick={() => navigate(link.path)}
                  className="flex items-center justify-between rounded-[18px] border border-orange-100 bg-orange-50/40 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-30px_rgba(255,115,0,0.4)]"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{link.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{link.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${link.accent}`}>
                    Mở
                  </span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
