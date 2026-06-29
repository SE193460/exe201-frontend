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
    <div className="min-h-screen bg-white text-slate-800">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
        <Sidebar activeKey="feedbacks" onLogout={handleLogout} />

        <main className="flex-1 space-y-6">
          <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-orange-500">Quản lý phản hồi</p>
                <h2 className="text-2xl font-bold">Danh sách feedback người dùng</h2>
              </div>
              <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                {items.length} feedback
              </span>
            </div>
          </section>

          {error && (
            <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
              {error}
            </section>
          )}

          <section className="overflow-x-auto rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
            <table className="w-full">
              <thead className="bg-orange-50">
                <tr className="text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Người gửi</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Vai trò</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Liên hệ</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nội dung</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      Đang tải feedback...
                    </td>
                  </tr>
                )}

                {!loading && pagedItems.map((item) => (
                  <tr key={item.id} className="border-t border-orange-50 align-top hover:bg-orange-50/30 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{item.displayName}</p>
                      <p className="text-xs text-slate-400">
                        {item.isAnonymous ? "Khách chưa đăng nhập" : item.userId}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.isAnonymous ? "Ẩn danh" : item.roleName || "user"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.isAnonymous ? (
                        <span className="text-slate-400">Không có</span>
                      ) : (
                        <div className="space-y-0.5">
                          <p>{item.email || "Không có email"}</p>
                          <p className="text-xs text-slate-500">{item.phoneNumber || "Không có SĐT"}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-pre-wrap break-words max-w-[480px]">{item.content}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                      Chưa có feedback nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </section>
        </main>
      </div>
    </div>
  );
}