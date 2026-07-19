import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { logout } from "../../api/services/auth";
import { fetchAdminFeedbacks, type FeedbackItem } from "../../api/services/feedback";
import Pagination from "../../components/Pagination";

export default function AdminFeedbacksPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAdminFeedbacks();
        setItems(data);
      } catch {
        setError("Không tải được danh sách feedback");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("access_token");
      navigate("/");
    }
  };

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="feedbacks" onLogout={handleLogout} />

        <main className="flex-1 space-y-6">
          <section className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">Quản lý phản hồi</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Danh sách feedback người dùng</h1>
            </div>
            <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-[var(--primary)] border border-orange-200">{items.length} feedback</span>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">{error}</div>
          )}

          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 text-left">Người gửi</th>
                  <th className="px-6 py-3 text-left">Vai trò</th>
                  <th className="px-6 py-3 text-left">Liên hệ</th>
                  <th className="px-6 py-3 text-left">Nội dung</th>
                  <th className="px-6 py-3 text-left">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Đang tải feedback...</td></tr>
                )}
                {!loading && pagedItems.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 align-top hover:bg-slate-50 transition">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-slate-800">{item.displayName}</p>
                      <p className="text-xs text-slate-400">{item.isAnonymous ? "Khách chưa đăng nhập" : item.userId}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">{item.isAnonymous ? "Ẩn danh" : item.roleName || "user"}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {item.isAnonymous ? <span className="text-slate-400">Không có</span> : (
                        <div className="space-y-0.5">
                          <p>{item.email || "Không có email"}</p>
                          <p className="text-xs text-slate-500">{item.phoneNumber || "Không có SĐT"}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700 whitespace-pre-wrap break-words max-w-[480px]">{item.content}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">Chưa có feedback nào</td></tr>
                )}
              </tbody>
            </table>
            <div className="px-6 pb-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
          </section>
        </main>
      </div>
    </div>
  );
}