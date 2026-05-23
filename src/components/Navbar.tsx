import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../api/services/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(Boolean(localStorage.getItem("access_token")));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem("access_token");
      setIsAuthed(false);
      navigate("/");
    }
  };

  return (
    <header className="border-b border-orange-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ff6a3d] text-white">
            🏠
          </span>
          RoomMate
        </button>
        <div className="flex items-center gap-3 text-sm font-semibold">
          {isAuthed ? (
            <>
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
