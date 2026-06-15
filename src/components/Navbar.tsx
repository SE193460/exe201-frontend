import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Bookmark, ChevronDown, CreditCard, LayoutDashboard, LogOut, SlidersHorizontal, UserRound, UsersRound } from "lucide-react";
import { logout } from "../api/services/auth";
import { fetchProfile } from "../api/services/user";
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, type Notification } from "../api/services/notifications";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthed(Boolean(token));
    if (!token) {
      setIsAdmin(false);
      setFullName("");
      return;
    }
    fetchProfile()
      .then((profile) => {
        setIsAdmin(profile.roleName === "admin");
        setFullName(profile.fullName || "");
      })
      .catch(() => {
        setIsAdmin(false);
        setFullName("");
      });
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [notifs, countData] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.count);
    } catch {
      // ignore
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem("access_token");
      setIsAuthed(false);
      setIsAdmin(false);
      setFullName("");
      navigate("/");
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    }
    if (n.listing_id) {
      navigate(`/listings/${n.listing_id}`);
    }
    setNotifOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
  };

  return (
    <header className="relative z-40 border-b border-orange-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <img src="/logo-roomie.svg" alt="ROOMIE logo" className="h-9 w-9 object-contain" />
            ROOMIE
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          {isAuthed ? (
            <>
              {!isAdmin && (
                <button
                  onClick={() => navigate("/my-listings")}
                  className="rounded-full px-4 py-2 text-slate-700 hover:bg-orange-50 transition"
                >
                  Bài đăng của tôi
                </button>
              )}

              <button
                onClick={() => navigate("/support")}
                className="rounded-full px-4 py-2 text-slate-700 hover:bg-orange-50 transition"
              >
                Liên hệ
              </button>

              {/* Notification bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => { setNotifOpen((prev) => !prev); setDropdownOpen(false); }}
                  className="relative rounded-full p-2 text-slate-600 hover:bg-orange-50 transition"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[0_20px_50px_-20px_rgba(255,115,0,0.3)]">
                    <div className="flex items-center justify-between border-b border-orange-50 px-4 py-3">
                      <span className="text-sm font-bold text-slate-700">Thông báo</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-orange-600 hover:underline"
                        >
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
                            <p className={`text-sm ${n.is_read ? "text-slate-600" : "font-bold text-slate-800"}`}>
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{n.message}</p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleDateString()}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-orange-50 transition"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6a3d] text-[11px] font-bold text-white">
                    {fullName ? fullName.slice(0, 1).toUpperCase() : "U"}
                  </span>
                  <span className="max-w-[120px] truncate">{fullName || "Tài khoản"}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-[0_20px_50px_-20px_rgba(255,115,0,0.3)]">
                    {isAdmin && (
                      <button
                        onClick={() => { setDropdownOpen(false); navigate("/admin/dashboard"); }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-orange-600" /> Dashboard Admin
                      </button>
                    )}
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition"
                    >
                      <UserRound className="h-4 w-4 text-slate-600" /> Cập nhật hồ sơ
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile/lifestyle"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition"
                    >
                      <UsersRound className="h-4 w-4 text-slate-600" /> Hồ sơ lối sống
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/soft-filter"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-slate-600" /> Bộ lọc mềm
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/saved-listings"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition"
                    >
                      <Bookmark className="h-4 w-4 text-slate-600" /> Tin đã lưu
                    </button>
                    <div className="border-t border-orange-50" />
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/payment-history"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-orange-50 transition"
                    >
                      <CreditCard className="h-4 w-4 text-slate-600" /> Lịch sử thanh toán
                    </button>
                    <div className="border-t border-orange-50" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/support")}
                className="rounded-full px-4 py-2 text-slate-700 hover:bg-orange-50 transition"
              >
                Liên hệ
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="rounded-full bg-[#ff6a3d] px-4 py-2 text-white shadow-sm"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
