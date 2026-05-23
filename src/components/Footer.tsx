import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-orange-100 bg-white/80">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500">
        <div>
          <p className="text-base font-semibold text-slate-700">RoomMate</p>
          <p className="mt-1">Kết nối bạn ở ghép phù hợp và an toàn.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/my-listings" className="text-slate-500 hover:text-slate-700">
            Bài đăng của tôi
          </Link>
          <Link to="/profile" className="text-slate-500 hover:text-slate-700">
            Cập nhật hồ sơ
          </Link>
          <a href="mailto:support@roommate.local" className="text-slate-500 hover:text-slate-700">
            Hỗ trợ
          </a>
        </div>
      </div>
    </footer>
  );
}
