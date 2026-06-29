import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Bookmark, CreditCard, LayoutDashboard, LogOut, Search, SlidersHorizontal, UserRound, UsersRound } from "lucide-react";
import { logout } from "../api/services/auth";
import { fetchProfile } from "../api/services/user";
import { fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead, type Notification } from "../api/services/notifications";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path: string) => location.pathname === path;

  const navLinks = isAuthed && !isAdmin
    ? [
        { label: "Home", path: "/" },
        { label: "My Posts", path: "/my-listings" },
        { label: "Saved", path: "/saved-listings" },
      ]
    : [
        { label: "Home", path: "/" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-3.5">
        {/* Left: Logo + Nav links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-extrabold italic text-[#c17a2f]"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            <img src="/logo-roomie.svg" alt="ROOMIE logo" className="h-9 w-9 object-contain" />
            RoomieMatch
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative px-3 py-1.5 text-sm font-semibold transition ${
                  isActive(link.path)
                    ? "text-[#c17a2f]"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#c17a2f]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-36 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  navigate(`/?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
                }
              }}
            />
          </div>

          {isAuthed ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive("/admin/dashboard")
                      ? "bg-[#c17a2f] text-white"
                      : "text-slate-600 hover:bg-orange-50"
                  }`}
                >
                  Dashboard
                </button>
              )}

              {!isAdmin && (
                <>
                  <button
                    onClick={() => navigate("/my-listings/new")}
                    className="rounded-full bg-[#c17a2f] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#a5681f] active:scale-[0.98]"
                  >
                    Post a Room
                  </button>

                  {/* Notification bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setNotifOpen((prev) => !prev); setDropdownOpen(false); }}
                      className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <span className="text-sm font-bold text-slate-800">Thông báo</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs font-semibold text-[#c17a2f] hover:underline"
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
                                className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${n.is_read ? "" : "bg-orange-50/40"}`}
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
                </>
              )}

              {/* User avatar + dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-full border-2 border-[#c17a2f]/20 p-0.5 transition hover:border-[#c17a2f]/40"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#c17a2f] text-xs font-bold text-white">
                    {fullName ? fullName.slice(0, 1).toUpperCase() : "U"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-bold text-slate-800">{fullName || "Tài khoản"}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => { setDropdownOpen(false); navigate("/admin/dashboard"); }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <LayoutDashboard className="h-4 w-4 text-orange-500" /> Dashboard Admin
                      </button>
                    )}
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <UserRound className="h-4 w-4 text-slate-500" /> Cập nhật hồ sơ
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/profile/lifestyle"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <UsersRound className="h-4 w-4 text-slate-500" /> Hồ sơ lối sống
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/soft-filter"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-slate-500" /> Bộ lọc mềm
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/saved-listings"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Bookmark className="h-4 w-4 text-slate-500" /> Tin đã lưu
                    </button>
                    <div className="border-t border-slate-100" />
                    <button
                      onClick={() => { setDropdownOpen(false); navigate("/payment-history"); }}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                    >
                      <CreditCard className="h-4 w-4 text-slate-500" /> Lịch sử thanh toán
                    </button>
                    <div className="border-t border-slate-100" />
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
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Contact
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="rounded-full bg-[#c17a2f] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#a5681f]"
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
