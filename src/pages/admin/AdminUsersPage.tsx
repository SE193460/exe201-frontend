import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserDetail, fetchUsers, updateUserStatus, type AdminUser } from "../../api/services/admin";
import { resolveAvatarUrl } from "../../api/services/user";
import { logout } from "../../api/services/auth";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="users" onLogout={handleLogout} />

        <main className="flex-1 space-y-6">
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">Bảng điều khiển</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Quản lý người dùng</h1>
              <p className="mt-1 text-sm text-slate-500">{filteredLabel} · {users.length} tài khoản</p>
            </div>
            <form onSubmit={handleSearch} className="flex w-full max-w-md gap-2">
              <input value={query} onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--primary)]" placeholder="Tìm theo email hoặc họ tên" />
              <button className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition">Tìm</button>
            </form>
          </section>

          <div className="flex flex-wrap gap-2">
            {["all", "active", "inactive"].map((item) => (
              <button key={item} onClick={() => setStatus(item)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition ${status === item ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                {statusLabels[item]}
              </button>
            ))}
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">Danh sách người dùng</h2>
                {loading && <span className="text-xs text-slate-400">Đang tải...</span>}
              </div>
              <div className="mt-4 space-y-2">
                {users.slice((userPage - 1) * USER_PAGE_SIZE, userPage * USER_PAGE_SIZE).map((user) => (
                  <button key={user.id} onClick={() => handleSelect(user)}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${selected?.id === user.id ? "border-[var(--primary)] bg-orange-50/50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--primary-container)]">
                        {user.avatarUrl ? (
                          <img src={resolveAvatarUrl(user.avatarUrl)} alt={user.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--primary)]">{user.fullName.slice(0, 1).toUpperCase()}</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${user.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {user.isActive ? "Đang hoạt động" : "Đã vô hiệu"}
                      </span>
                      <p className="mt-1 text-xs text-slate-400">{user.roleName}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Pagination currentPage={userPage} totalPages={Math.ceil(users.length / USER_PAGE_SIZE)} onPageChange={setUserPage} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold text-slate-700">Chi tiết</h2>
              {selected ? (
                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-[var(--primary-container)]">
                      {selected.avatarUrl ? (
                        <img src={resolveAvatarUrl(selected.avatarUrl)} alt={selected.fullName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--primary)]">{selected.fullName.slice(0, 1).toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800">{selected.fullName}</p>
                      <p className="text-xs text-slate-500">{selected.email}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</p>
                    <p className="mt-1 font-semibold">{selected.isActive ? "Đang hoạt động" : "Đã vô hiệu"}</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Xác thực email</p>
                    <p className="mt-1 font-semibold">{selected.isEmailVerified ? "Đã xác thực" : "Chưa xác thực"}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Vai trò</span>
                    <span className="font-bold text-slate-700">{selected.roleName}</span>
                  </div>
                  <button onClick={() => handleToggleActive(selected)}
                    className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-white transition ${selected.isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-green-500 hover:bg-green-600"}`}>
                    {selected.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">Chọn một tài khoản để xem chi tiết.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
