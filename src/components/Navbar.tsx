import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/services/auth";
import { fetchProfile } from "../api/services/user";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthed(Boolean(token));
    if (!token) {
      setIsAdmin(false);
      return;
    }
    fetchProfile()
      .then((profile) => {
        setIsAdmin(profile.roleName === "admin");
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem("access_token");
      setIsAuthed(false);
      setIsAdmin(false);
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
              🏠
            </span>
            RoomMate
          </button>
          <button
            onClick={() => navigate("/listings")}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-[#ff6a3d] transition"
          >
            Phòng ở ghép
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold">
          {isAuthed ? (
            <>
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="rounded-full px-4 py-2 text-slate-700 hover:bg-orange-50"
                >
                  Dashboard
                </button>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="rounded-full px-4 py-2 text-slate-700 hover:bg-orange-50"
              >
                Cập nhật hồ sơ
              </button>
              <button
                onClick={() => navigate("/my-listings")}
                className="rounded-full px-4 py-2 text-slate-700 hover:bg-orange-50"
              >
                Bài đăng của tôi
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-slate-700 shadow-sm"
              >
                Đăng xuất
              </button>
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
