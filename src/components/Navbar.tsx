import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, House, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { logout } from "../api/services/auth";
import { fetchProfile } from "../api/services/user";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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

  return (
    <header className="border-b border-orange-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6a3d] text-white">
              <House className="h-4.5 w-4.5" />
            </span>
            RoomMate
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
            <button
              onClick={() => navigate("/auth")}
              className="rounded-full bg-[#ff6a3d] px-4 py-2 text-white shadow-sm"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
