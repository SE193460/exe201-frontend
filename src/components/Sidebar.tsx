import { useNavigate } from "react-router-dom";

export type AdminSidebarKey = "dashboard" | "users" | "listings" | "imported-listings" | "amenities";

type SidebarProps = {
  activeKey: AdminSidebarKey;
  onLogout: () => void | Promise<void>;
};

const navItems: Array<{ key: AdminSidebarKey; label: string; path: string }> = [
  { key: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
  { key: "users", label: "Quản lý người dùng", path: "/admin/users" },
  { key: "listings", label: "Quản lý bài đăng", path: "/admin/listings" },
  { key: "imported-listings", label: "Quản lý nguồn bài đăng", path: "/admin/imported-listings" },
  { key: "amenities", label: "Quản lý tiện nghi", path: "/admin/amenities" },
];

export default function Sidebar({ activeKey, onLogout }: SidebarProps) {
  const navigate = useNavigate();

  return (
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

          {navItems.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`w-full rounded-full px-4 py-2 text-left transition ${
                  isActive ? "bg-orange-100 text-orange-700" : "text-slate-600 hover:bg-orange-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50"
      >
        Đăng xuất
      </button>
    </aside>
  );
}