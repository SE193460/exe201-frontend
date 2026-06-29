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
        <div className="min-h-screen bg-white text-slate-800">
            <div className="mx-auto flex min-h-screen w-full max-w-[1400px] gap-6 px-6 py-8">
                <Sidebar activeKey="reports" onLogout={handleLogout} />

                <main className="flex-1 space-y-6">
                    <section className="rounded-[24px] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm font-semibold text-orange-500">Quản lý báo cáo</p>
                                <h2 className="text-2xl font-bold">Lịch sử báo cáo</h2>
                            </div>
                            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-700">
                                {reports.length} báo cáo
                            </span>
                        </div>
                    </section>

                    {error && (
                        <section className="rounded-[24px] border border-red-100 bg-white p-4 text-sm text-red-600 shadow-sm">
                            {error}
                        </section>
                    )}

                    <div className="rounded-[24px] border border-orange-100 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(255,115,0,0.5)] overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-orange-50">
                                <tr className="text-left">
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Người báo cáo</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Bài đăng</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Chủ bài</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Lý do</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mô tả</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ngày</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Trạng thái</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedReports.map(item => (
                                    <tr key={item.id} className="border-t border-orange-50 hover:bg-orange-50/40 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{item.reporterName || "-"}</div>
                                            <div className="text-xs text-slate-400">{item.reporterEmail || ""}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.listingTitle ? (
                                                <button
                                                    onClick={() => navigate(`/listings/${item.listingId}`)}
                                                    className="text-orange-600 hover:underline text-sm font-medium"
                                                >
                                                    {item.listingTitle}
                                                </button>
                                            ) : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{item.listingOwner || "-"}</td>
                                        <td className="px-6 py-4 text-sm whitespace-pre-wrap break-words max-w-[280px]">{item.reason}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-pre-wrap break-words max-w-[280px]">{item.description || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(item.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status === "PENDING" ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleResolve(item.id, "RESOLVED")}
                                                        className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200"
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolve(item.id, "DISMISSED")}
                                                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                                                    >
                                                        Bỏ qua
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                                            Chưa có báo cáo nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </main>
            </div>
        </div>
    );
}
