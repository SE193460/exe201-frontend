import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/services/auth";
import {
    fetchAllReports,
    resolveReport,
    type Report
} from "../../api/services/reports";
import Sidebar from "../../components/Sidebar";
import Pagination from "../../components/Pagination";

export default function AdminReportsPage() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [reports, setReports] = useState<Report[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const data = await fetchAllReports();
            setReports(data);
        } catch {
            setError("Không tải được báo cáo");
        }
    };

    const handleResolve = async (reportId: string, status: "RESOLVED" | "DISMISSED") => {
        try {
            await resolveReport(reportId, status);
            setReports(prev =>
                prev.map(r =>
                    r.id === reportId ? { ...r, status } : r
                )
            );
        } catch {
            alert("Cập nhật thất bại");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            localStorage.removeItem("access_token");
            navigate("/");
        }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-700",
            RESOLVED: "bg-green-100 text-green-700",
            DISMISSED: "bg-slate-100 text-slate-500",
        };
        return styles[status] || "bg-slate-100 text-slate-500";
    };

    const totalPages = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
    const pagedReports = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
                <Sidebar activeKey="reports" onLogout={handleLogout} />

                <main className="flex-1 space-y-6">
                    <section className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--primary)]">Quản lý báo cáo</p>
                            <h1 className="mt-1 text-2xl font-extrabold text-slate-900" style={{ fontFamily: "var(--font-main)" }}>Lịch sử báo cáo</h1>
                        </div>
                        <span className="rounded-full bg-orange-50 px-4 py-2 text-xs font-bold text-[var(--primary)] border border-orange-200">{reports.length} báo cáo</span>
                    </section>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-600">{error}</div>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-3 text-left">Người báo cáo</th>
                                    <th className="px-6 py-3 text-left">Bài đăng</th>
                                    <th className="px-6 py-3 text-left">Chủ bài</th>
                                    <th className="px-6 py-3 text-left">Lý do</th>
                                    <th className="px-6 py-3 text-left">Mô tả</th>
                                    <th className="px-6 py-3 text-left">Ngày</th>
                                    <th className="px-6 py-3 text-left">Trạng thái</th>
                                    <th className="px-6 py-3 text-left">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedReports.map(item => (
                                    <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-sm">{item.reporterName || "-"}</div>
                                            <div className="text-xs text-slate-400">{item.reporterEmail || ""}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            {item.listingTitle ? (
                                                <button onClick={() => navigate(`/listings/${item.listingId}`)}
                                                    className="text-[var(--primary)] hover:underline text-sm font-medium">{item.listingTitle}</button>
                                            ) : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-500">{item.listingOwner || "-"}</td>
                                        <td className="px-6 py-3 text-sm whitespace-pre-wrap break-words max-w-[280px]">{item.reason}</td>
                                        <td className="px-6 py-3 text-sm text-slate-500 whitespace-pre-wrap break-words max-w-[280px]">{item.description || "-"}</td>
                                        <td className="px-6 py-3 text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadge(item.status)}`}>{item.status}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            {item.status === "PENDING" ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleResolve(item.id, "RESOLVED")}
                                                        className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200 hover:bg-green-100">Duyệt</button>
                                                    <button onClick={() => handleResolve(item.id, "DISMISSED")}
                                                        className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100">Bỏ qua</button>
                                                </div>
                                            ) : <span className="text-xs text-slate-400">—</span>}
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">Chưa có báo cáo nào</td></tr>
                                )}
                            </tbody>
                        </table>
                        <div className="px-6 pb-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>
                    </div>
                </main>
            </div>
        </div>
    );
}
