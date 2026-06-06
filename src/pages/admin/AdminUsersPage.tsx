import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserDetail, fetchUsers, updateUserStatus, type AdminUser } from "../../api/services/admin";
import { resolveAvatarUrl } from "../../api/services/user";
import { logout } from "../../api/services/auth";
import Pagination from "../../components/Pagination";

const statusLabels: Record<string, string> = {
  all: "Tất cả",
  active: "Đang hoạt động",
  inactive: "Đã vô hiệu",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [userPage, setUserPage] = useState(1);
  const USER_PAGE_SIZE = 8;

  const filteredLabel = useMemo(() => statusLabels[status] || "Tất cả", [status]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers({ query, status });
      setUsers(data);
      if (selected) {
        const updated = data.find((item) => item.id === selected.id);
        if (updated) {
          setSelected(updated);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUserPage(1);
    loadUsers();
  }, [status]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setUserPage(1);
    loadUsers();
  };

  const handleSelect = async (user: AdminUser) => {
    try {
      const detail = await fetchUserDetail(user.id);
      setSelected(detail);
    } catch {
      setSelected(user);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    await updateUserStatus(user.id, !user.isActive);
    await loadUsers();
  };

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
              onClick={() => navigate("/admin/dashboard")}
              className="w-full rounded-full px-4 py-2 text-left text-slate-600 hover:bg-orange-50"
            >
              Dashboard
            </button>
            <button
              className="w-full rounded-full bg-orange-100 px-4 py-2 text-left text-orange-700"
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
                <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
                <p className="mt-1 text-sm text-slate-500">{filteredLabel} · {users.length} tài khoản</p>
              </div>
              <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-full border border-orange-100 px-4 py-2 text-sm outline-none focus:border-orange-300"
                  placeholder="Tìm theo email hoặc họ tên"
                />
                <button className="rounded-full bg-[#ff6a3d] px-5 py-2 text-sm font-semibold text-white">
                  Tìm
                </button>
              </form>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["all", "active", "inactive"].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${
                    status === item
                      ? "bg-orange-100 text-orange-700"
                      : "border border-orange-100 text-slate-500"
                  }`}
                >
                  {statusLabels[item]}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Danh sách người dùng</h2>
                {loading && <span className="text-xs text-slate-400">Đang tải...</span>}
              </div>
              <div className="mt-4 space-y-3">
                {users.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selected?.id === user.id
                        ? "border-orange-200 bg-orange-50"
                        : "border-orange-100 bg-white hover:bg-orange-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-orange-100">
                        {user.avatarUrl ? (
                          <img
                            src={resolveAvatarUrl(user.avatarUrl)}
                            alt={user.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-orange-500">
                            {user.fullName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isActive ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {user.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">{user.roleName}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Pagination
                currentPage={userPage}
                totalPages={Math.ceil(users.length / USER_PAGE_SIZE)}
                onPageChange={setUserPage}
              />
            </div>

            <div className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
              <h2 className="text-lg font-semibold">Chi tiết</h2>
              {selected ? (
                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-orange-100">
                      {selected.avatarUrl ? (
                        <img
                          src={resolveAvatarUrl(selected.avatarUrl)}
                          alt={selected.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-orange-500">
                          {selected.fullName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-800">{selected.fullName}</p>
                      <p className="text-xs text-slate-500">{selected.email}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-orange-50 px-4 py-3">
                    <p className="text-xs text-slate-500">Trạng thái</p>
                    <p className="mt-1 font-semibold">
                      {selected.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">Xác thực email</p>
                    <p className="mt-1 font-semibold">
                      {selected.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Vai trò</span>
                    <span className="font-semibold text-slate-700">{selected.roleName}</span>
                  </div>
                  <button
                    onClick={() => handleToggleActive(selected)}
                    className={`w-full rounded-full px-4 py-2 text-sm font-semibold text-white ${
                      selected.isActive ? "bg-amber-500" : "bg-green-500"
                    }`}
                  >
                    {selected.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Chọn một tài khoản để xem chi tiết.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
