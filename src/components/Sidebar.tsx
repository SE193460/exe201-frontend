import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Menu, X } from "lucide-react";
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, type Notification } from "../api/services/notifications";

export type AdminSidebarKey = "dashboard" | "users" | "listings" | "imported-listings" | "amenities" | "payments" | "reports" | "feedbacks";

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
  { key: "payments", label: "Quản lý thanh toán", path: "/admin/payments" },
  { key: "reports", label: "Báo cáo hệ thống", path: "/admin/reports" },
  { key: "feedbacks", label: "Feedback người dùng", path: "/admin/feedbacks" },
];

export default function Sidebar({ activeKey, onLogout }: SidebarProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const loadNotifications = async () => {
    try {
      const [notifs, countData] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch { /* ignore */ }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch { /* ignore */ }
    }
    if (n.listing_id) {
      navigate(`/listings/${n.listing_id}`);
    }
    setNotifOpen(false);
    setMobileOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
    } catch { /* ignore */ }
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger toggle — visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-20 z-50 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg border border-slate-200 md:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="h-5 w-5 text-slate-700" />
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-[260px] flex-col bg-white p-5 shadow-xl transition-transform duration-200
          md:static md:z-auto md:h-auto md:w-full md:max-w-[250px] md:rounded-[24px] md:p-6 md:shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <img src="/logo-roomie.svg" alt="ROOMIE logo" className="h-8 w-8 object-contain" />
            Admin
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop logo */}
        <div className="hidden items-center gap-2 text-lg font-semibold md:flex">
          <img src="/logo-roomie.svg" alt="ROOMIE logo" className="h-9 w-9 object-contain" />
          ROOMIE Admin
        </div>

        <div className="mt-6 flex-1 space-y-1 text-sm font-semibold md:mt-8">
          <button
            onClick={() => handleNav("/home")}
            className="w-full rounded-full px-4 py-2.5 text-left text-slate-600 hover:bg-orange-50 transition"
          >
            Trang chủ
          </button>

          {navItems.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.path)}
                className={`w-full rounded-full px-4 py-2.5 text-left transition ${
                  isActive ? "bg-orange-100 text-orange-700" : "text-slate-600 hover:bg-orange-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {/* Notification bell */}
          <div className="relative pt-2" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((prev) => !prev); loadNotifications(); }}
              className="relative flex w-full items-center gap-2.5 rounded-full px-4 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-orange-50 transition"
            >
              <Bell className="h-4 w-4" />
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[calc(100vw-80px)] max-w-[300px] overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[0_20px_50px_-20px_rgba(255,115,0,0.3)]">
                <div className="flex items-center justify-between border-b border-orange-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-700">Thông báo</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs font-semibold text-orange-600 hover:underline">
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-400">Chưa có thông báo</p>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full px-4 py-3 text-left transition hover:bg-orange-50/60 ${n.is_read ? "" : "bg-orange-50/30"}`}
                      >
                        <p className={`text-sm ${n.is_read ? "text-slate-600" : "font-bold text-slate-800"}`}>{n.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => { onLogout(); setMobileOpen(false); }}
          className="mt-4 w-full rounded-full border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-orange-50 transition"
        >
          Đăng xuất
        </button>
      </aside>
    </>
  );
}
