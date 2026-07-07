import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Bookmark, CreditCard, LayoutDashboard, LogOut, Search, SlidersHorizontal, UserRound, UsersRound, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await logout();
    } catch {
      // ignore
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
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3 md:px-6 md:py-3.5">
        {/* Left: Hamburger (mobile) + Logo + Nav links (desktop) */}
        <div className="flex items-center gap-4">
          {/* Hamburger button — mobile only */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            onClick={() => { navigate("/"); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 text-xl font-extrabold italic text-[#ff8c00]"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            <img src="/logo-roomie.svg" alt="ROOMIE logo" className="h-8 w-8 object-contain md:h-9 md:w-9" />
            <span className="hidden sm:inline">Roomie</span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`relative px-3 py-1.5 text-sm font-semibold transition ${
                  isActive(link.path)
                    ? "text-[#ff8c00]"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#ff8c00]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search bar — desktop only */}
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
                  className={`hidden rounded-full px-4 py-2 text-sm font-semibold transition md:inline-flex ${
                    isActive("/admin/dashboard")
                      ? "bg-[#ff8c00] text-white"
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
                    className="hidden rounded-full bg-[#ff8c00] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#a5681f] active:scale-[0.98] md:inline-flex"
                  >
                    Post a Room
                  </button>

                  {/* Notification bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => { setNotifOpen((prev) => !prev); setDropdownOpen(false); }}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-32px)] max-w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)]">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <span className="text-sm font-bold text-slate-800">Thông báo</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-xs font-semibold text-[#ff8c00] hover:underline"
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
                  className="flex items-center gap-1 rounded-full border-2 border-[#ff8c00]/20 p-0.5 transition hover:border-[#ff8c00]/40"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff8c00] text-xs font-bold text-white">
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
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition md:inline-flex"
              >
                Contact
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="rounded-full bg-[#ff8c00] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#a5681f] md:px-5"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="border-t border-slate-100 bg-white md:hidden">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}
                className={`flex h-12 items-center rounded-lg px-3 text-sm font-semibold transition ${
                  isActive(link.path)
                    ? "bg-orange-50 text-[#ff8c00]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </button>
            ))}
            {isAuthed && !isAdmin && (
              <button
                onClick={() => { navigate("/my-listings/new"); setMobileMenuOpen(false); }}
                className="flex h-12 items-center rounded-lg bg-[#ff8c00] px-3 text-sm font-bold text-white transition hover:bg-[#a5681f] md:hidden"
              >
                Post a Room
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => { navigate("/admin/dashboard"); setMobileMenuOpen(false); }}
                className={`flex h-12 items-center rounded-lg px-3 text-sm font-semibold transition ${
                  isActive("/admin/dashboard") ? "bg-orange-50 text-[#ff8c00]" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Dashboard Admin
              </button>
            )}
            {!isAuthed && (
              <button
                onClick={() => { navigate("/support"); setMobileMenuOpen(false); }}
                className="flex h-12 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Contact
              </button>
            )}
            {/* Search in mobile menu */}
            <div className="mt-2 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 md:hidden">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    navigate(`/?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
                    setMobileMenuOpen(false);
                  }
                }}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
